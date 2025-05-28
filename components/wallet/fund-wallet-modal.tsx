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
import { generateTransactionReference } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  calculateTotalWithAllFees,
  calculateAmountWithPaystackFee,
} from "@/lib/fee-calculator";

interface FundWalletModalProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function FundWalletModal({ onSuccess, trigger }: FundWalletModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(true);
  const [includeFees, setIncludeFees] = useState(true);
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [feeBreakdown, setFeeBreakdown] = useState<any>(null);
  const { data: session } = useSession();

  // Calculate total amount with fees when amount changes
  useEffect(() => {
    if (amount > 0 && includeFees) {
      const calculation = calculateTotalWithAllFees(amount, false);
      setTotalAmount(calculation.totalAmount.toFixed(2));
      setFeeBreakdown(calculation);
    } else {
      setTotalAmount(amount.toFixed(2));
      setFeeBreakdown(null);
    }
  }, [amount, includeFees]);

  const handleSuccess = () => {
    setIsOpen(false);
    if (onSuccess) onSuccess();
    toast.success("Wallet Funded", {
      description: `Your wallet has been funded with ₦${amount.toFixed(2)}.`,
    });
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
              <p>Base Amount: ₦{feeBreakdown.baseAmount.toFixed(2)}</p>
              <p>Paystack Fee: ₦{feeBreakdown.paystackFee.toFixed(2)}</p>
              <p className="font-medium mt-1">
                Total: ₦{feeBreakdown.totalAmount.toFixed(2)}
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
              amount={parseFloat(totalAmount)}
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
