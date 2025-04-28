"use client";

import type React from "react";

import { useState } from "react";
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

interface FundWalletModalProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function FundWalletModal({ onSuccess, trigger }: FundWalletModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <PaystackButton
            amount={amount}
            email={session?.user?.email || ""}
            metadata={{
              type: "wallet_funding",
            }}
            onSuccess={handleSuccess}
            onError={handleError}
            disabled={amount < 100}
          >
            Fund Wallet
          </PaystackButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
