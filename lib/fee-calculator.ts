/**
 * Fee Calculator Module
 *
 * This module provides utilities for calculating various fees in the application,
 * including Paystack transaction fees and escrow service fees.
 */

import { _escrowConfig } from "@/config";
import { logger } from "./logger";

/**
 * Paystack fee structure
 * Based on: https://paystack.com/pricing
 */
export const paystackFeeConfig = {
  percentageFee: 1.5, // 1.5% for local transactions
  capFee: 2000, // Maximum fee capped at ₦2,000
  flatFee: 100, // Additional ₦100 flat fee
  internationalPercentageFee: 3.9, // 3.9% for international transactions
  internationalFlatFee: 100, // Additional ₦100 flat fee for international
};

/**
 * Calculate Paystack's transaction fee
 *
 * @param amount - The transaction amount in Naira
 * @param isInternational - Whether this is an international transaction
 * @returns The fee amount in Naira
 */
export function calculatePaystackFee(
  amount: number,
  isInternational = false
): number {
  const percentageFee = isInternational
    ? paystackFeeConfig.internationalPercentageFee
    : paystackFeeConfig.percentageFee;

  const flatFee = isInternational
    ? paystackFeeConfig.internationalFlatFee
    : paystackFeeConfig.flatFee;

  // Calculate percentage component
  let fee = (amount * percentageFee) / 100;

  // Add flat fee
  fee += flatFee;

  // Cap the fee if necessary (for local transactions only)
  if (!isInternational && fee > paystackFeeConfig.capFee) {
    fee = paystackFeeConfig.capFee;
  }

  return fee;
}

/**
 * Calculate the escrow service fee
 *
 * @param amount - The transaction amount in Naira
 * @returns The escrow fee amount in Naira
 */
export function calculateEscrowFee(amount: number): number {
  return amount * _escrowConfig.escrowFee;
}

/**
 * Calculate the total amount needed to receive a specific amount after Paystack fees
 *
 * @param desiredAmount - The amount you want to receive after Paystack fees
 * @param isInternational - Whether this is an international transaction
 * @returns The total amount to charge including Paystack fees
 */
export function calculateAmountWithPaystackFee(
  desiredAmount: number,
  isInternational = false
): number {
  const percentageFee = isInternational
    ? paystackFeeConfig.internationalPercentageFee
    : paystackFeeConfig.percentageFee;

  const flatFee = isInternational
    ? paystackFeeConfig.internationalFlatFee
    : paystackFeeConfig.flatFee;

  // Apply the formula: (Amount you want to receive * 100) / (100 - Paystack percentage fee)
  let totalAmount = (desiredAmount * 100) / (100 - percentageFee);

  // Account for the flat fee
  totalAmount += flatFee;

  // For local transactions, we need to check if the fee exceeds the cap
  if (!isInternational) {
    const calculatedFee = (totalAmount * percentageFee) / 100 + flatFee;

    if (calculatedFee > paystackFeeConfig.capFee) {
      // If the fee would exceed the cap, we need to recalculate
      totalAmount = desiredAmount + paystackFeeConfig.capFee;
    }
  }

  return totalAmount;
}

/**
 * Calculate the total amount including both Paystack and escrow fees
 *
 * @param baseAmount - The base transaction amount before any fees
 * @param isInternational - Whether this is an international transaction
 * @returns An object containing the breakdown of all fees and amounts
 */
export function calculateTotalWithAllFees(
  baseAmount: number,
  isInternational = false
): {
  baseAmount: number;
  escrowFee: number;
  escrowFeePercentage: number;
  paystackFee: number;
  totalAmount: number;
  amountAfterEscrowFee: number;
  finalAmountReceived: number;
} {
  try {
    // Calculate escrow fee
    const escrowFee = calculateEscrowFee(baseAmount);
    const escrowFeePercentage = _escrowConfig.escrowFee * 100;

    // Amount after escrow fee is deducted
    // const amountAfterEscrowFee = baseAmount + escrowFee;
    const amountAfterEscrowFee = baseAmount;

    // Calculate the total amount needed to receive the amount after escrow fee
    const totalAmount = calculateAmountWithPaystackFee(
      amountAfterEscrowFee,
      isInternational
    );

    // Calculate the actual Paystack fee that will be charged
    const paystackFee = totalAmount - amountAfterEscrowFee;

    // The final amount that will be received by the platform after all fees
    const finalAmountReceived = baseAmount;

    return {
      baseAmount,
      escrowFee,
      escrowFeePercentage,
      paystackFee,
      totalAmount,
      amountAfterEscrowFee,
      finalAmountReceived,
    };
  } catch (error) {
    logger.error("Error calculating fees", {
      error,
      baseAmount,
      isInternational,
    });
    throw new Error("Failed to calculate transaction fees");
  }
}

/**
 * Format a fee breakdown for display
 *
 * @param feeBreakdown - The fee breakdown object from calculateTotalWithAllFees
 * @returns A formatted string with the fee breakdown
 */
export function formatFeeBreakdown(
  feeBreakdown: ReturnType<typeof calculateTotalWithAllFees>
): string {
  return `
Base Amount: ₦${feeBreakdown.baseAmount.toFixed(2)}
Escrow Fee (${feeBreakdown.escrowFeePercentage}%): ₦${feeBreakdown.escrowFee.toFixed(2)}
Paystack Fee: ₦${feeBreakdown.paystackFee.toFixed(2)}
Total Amount: ₦${feeBreakdown.totalAmount.toFixed(2)}
  `.trim();
}
