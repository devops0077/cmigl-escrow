"use client";

import { AlertTriangle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

interface InsufficientFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount: number;
  currentBalance: number;
  onFundWallet: (shortfall: number) => void;
}

export function InsufficientFundsModal({
  isOpen,
  onClose,
  requiredAmount,
  currentBalance,
  onFundWallet,
}: InsufficientFundsModalProps) {
  const shortfall = requiredAmount - currentBalance;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle>Insufficient Wallet Balance</DialogTitle>
          <DialogDescription>
            You don't have enough funds in your wallet to complete this
            transaction.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Current Balance:</span>
              <span className="font-medium">
                {formatCurrency(currentBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Required Amount:</span>
              <span className="font-medium">
                {formatCurrency(requiredAmount)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-orange-700 dark:text-orange-300">
                Shortfall:
              </span>
              <span className="text-orange-700 dark:text-orange-300">
                {formatCurrency(shortfall)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            You need to add at least{" "}
            <strong>{formatCurrency(shortfall)}</strong> to your wallet to
            proceed with this transaction.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-col space-y-2">
          <Button
            onClick={() => onFundWallet(shortfall)}
            className="w-full flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            Fund Wallet
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
