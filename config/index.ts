export const _escrowConfig = {
  escrowFee: 0.045, // 4.5% escrow fee
  minEscrowAmount: 100, // Minimum amount for escrow
  maxEscrowAmount: 10000, // Maximum amount for escrow
  transactionFee: 0.02, // 2% transaction fee
  minTransactionAmount: 10, // Minimum amount for transaction
  maxTransactionAmount: 5000, // Maximum amount for transaction
  registrationFee: 500, // Registration fee in Naira
  registrationFeeString: "₦500.00", // Registration fee string for display
  publicUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
};
