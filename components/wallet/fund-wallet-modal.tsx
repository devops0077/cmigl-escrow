"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaystackButton } from "@/components/payments/paystack-button";
import { toast } from "sonner";
import { formatCurrency, generateTransactionReference } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  calculateTotalWithAllFees,
  calculateAmountWithPaystackFee,
} from "@/lib/fee-calculator";
import { useRouter, useSearchParams } from "next/navigation";

interface FundWalletModalProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function FundWalletModal({ onSuccess, trigger }: FundWalletModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [includeFees, setIncludeFees] = useState(true);
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [feeBreakdown, setFeeBreakdown] = useState<any>(null);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const amountParam = searchParams.get("amount");
  const modalOpen = searchParams.get("modal");
  const returnUrl = searchParams.get("returnUrl");
  const router = useRouter();

  // Calculate total amount with fees when amount changes
  useEffect(() => {
    if (amount > 0 && includeFees) {
      const calculation = calculateTotalWithAllFees(amount, false);
      setTotalAmount(String(calculation.totalAmount));
      setFeeBreakdown(calculation);
    } else {
      setTotalAmount(String(amount));
      setFeeBreakdown(null);
    }
  }, [amount, includeFees]);

  useEffect(() => {
    if (modalOpen === "true") {
      setIsOpen(true);
      if (amountParam) {
        const parsedAmount = Number.parseFloat(amountParam);
        if (!isNaN(parsedAmount) && parsedAmount >= 100) {
          setAmount(parsedAmount);
        }
      }
    } else {
      setIsOpen(false);
    }
  }, [amountParam, modalOpen]);

  const handleSuccess = () => {
    setIsOpen(false);
    if (onSuccess) onSuccess();
    toast.success("Wallet Funded", {
      description: `Your wallet has been funded with ${formatCurrency(amount)}.`,
    });

    if (returnUrl) {
      setTimeout(() => {
        router.push(returnUrl);
      }, 1500); // Short delay to allow the toast to be seen
    }
  };

  const handleError = (error: any) => {
    toast.error("Error", {
      description:
        error.message || "An error occurred while funding your wallet.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="default">Fund Wallet</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Fund Your Wallet</DialogTitle>
          <DialogDescription>
            Enter the amount you want to add to your wallet.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3 flex items-center">
              <span className="mr-2">₦</span>
              <Input
                id="amount"
                type="number"
                min="100"
                step="100"
                value={amount || ""}
                onChange={(e) =>
                  setAmount(Number.parseFloat(e.target.value) || 0)
                }
                className="col-span-3"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeFees"
              checked={includeFees}
              onCheckedChange={(checked) => setIncludeFees(checked as boolean)}
              hidden
            />
            <Label htmlFor="includeFees" hidden className="text-sm">
              Include Paystack transaction fees
            </Label>
          </div>

          {includeFees && feeBreakdown && (
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium mb-1">Fee Breakdown:</p>
              <p>Base Amount: {formatCurrency(feeBreakdown.baseAmount)}</p>
              <p>Paystack Fee: {formatCurrency(feeBreakdown.paystackFee)}</p>
              <p className="font-medium mt-1">
                Total: {formatCurrency(feeBreakdown.totalAmount)}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          {includeFees && feeBreakdown && (
            <PaystackButton
              amount={Math.round(Number(totalAmount))}
              email={session?.user?.email || ""}
              metadata={{
                type: "wallet_funding",
                includeFees,
                originalAmount: amount * 100,
              }}
              reference={generateTransactionReference()}
              onSuccess={handleSuccess}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
