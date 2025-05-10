"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWallet } from "@/hooks/use-wallet";

// Bank type definition
type Bank = {
  code: string;
  name: string;
  slug?: string;
  active?: boolean;
};

const formSchema = z.object({
  amount: z.coerce
    .number()
    .positive({
      message: "Amount must be greater than 0.",
    })
    .min(1000, {
      message: "Minimum withdrawal amount is ₦1,000.",
    }),
  bankCode: z.string().min(1, {
    message: "Please select a bank.",
  }),
  accountNumber: z.string().length(10, {
    message: "Account number must be 10 digits.",
  }),
});

export function WithdrawModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [withdrawalReference, setWithdrawalReference] = useState<string | null>(
    null
  );
  const [withdrawalStatus, setWithdrawalStatus] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { data: walletData, refetch: refetchWallet } = useWallet();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      bankCode: "",
      accountNumber: "",
    },
  });

  // Watch for account number and bank code changes to resolve account
  const watchBankCode = form.watch("bankCode");
  const watchAccountNumber = form.watch("accountNumber");
  const watchAmount = form.watch("amount");

  // Fetch banks when modal opens
  useEffect(() => {
    if (open && banks.length === 0) {
      fetchBanks();
    }

    // Reset withdrawal status when modal opens/closes
    if (!open) {
      setWithdrawalReference(null);
      setWithdrawalStatus(null);
    }
  }, [open, banks.length]);

  // Resolve account number when both bank code and account number are provided
  useEffect(() => {
    const accountNumber = watchAccountNumber;
    const bankCode = watchBankCode;

    // Reset account name and error when inputs change
    setAccountName("");
    setAccountError("");

    if (accountNumber?.length === 10 && bankCode) {
      resolveAccountNumber(accountNumber, bankCode);
    }
  }, [watchAccountNumber, watchBankCode]);

  // Check if amount exceeds wallet balance
  useEffect(() => {
    if (
      watchAmount &&
      walletData?.balance &&
      watchAmount > walletData.balance
    ) {
      form.setError("amount", {
        type: "manual",
        message: `Amount exceeds your wallet balance of ₦${walletData.balance.toLocaleString()}`,
      });
    } else {
      form.clearErrors("amount");
    }
  }, [watchAmount, walletData?.balance, form]);

  // Save withdrawal reference to localStorage to recover from page refreshes
  useEffect(() => {
    // When a new withdrawal is initiated, save the reference
    if (withdrawalReference) {
      localStorage.setItem("pendingWithdrawalReference", withdrawalReference);
    }

    // When a withdrawal is completed or failed, remove the reference
    if (withdrawalStatus === "COMPLETED" || withdrawalStatus === "FAILED") {
      localStorage.removeItem("pendingWithdrawalReference");
    }
  }, [withdrawalReference, withdrawalStatus]);

  // Check for pending withdrawals on component mount
  useEffect(() => {
    const pendingReference = localStorage.getItem("pendingWithdrawalReference");
    if (pendingReference) {
      setWithdrawalReference(pendingReference);
      setWithdrawalStatus("PENDING");
      setOpen(true);
      checkWithdrawalStatus(pendingReference);
    }
  }, []);

  // Fetch banks from API
  const fetchBanks = async () => {
    setIsFetchingBanks(true);
    try {
      const response = await fetch("/api/banks/list");
      if (!response.ok) {
        throw new Error("Failed to fetch banks");
      }
      const data = await response.json();
      // Sort banks alphabetically
      const sortedBanks = data.banks.sort((a: Bank, b: Bank) =>
        a.name.localeCompare(b.name)
      );
      setBanks(sortedBanks);
    } catch (error) {
      logger.error("Error fetching banks", { error });
      toast.error("Failed to load banks", {
        description: "Please try again later",
      });
    } finally {
      setIsFetchingBanks(false);
    }
  };

  // Resolve account number
  const resolveAccountNumber = async (
    accountNumber: string,
    bankCode: string
  ) => {
    setIsResolvingAccount(true);
    setAccountError("");

    try {
      const response = await fetch("/api/banks/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountNumber, bankCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Could not resolve account");
      }

      const data = await response.json();
      setAccountName(data.accountDetails.account_name);
    } catch (error) {
      logger.error("Account resolution error", { error });
      setAccountError(
        error instanceof Error ? error.message : "Could not verify account"
      );
      setAccountName("");
    } finally {
      setIsResolvingAccount(false);
    }
  };

  // Check withdrawal status
  const checkWithdrawalStatus = useCallback(
    async (reference: string) => {
      if (!reference || isCheckingStatus) return;

      setIsCheckingStatus(true);
      try {
        const response = await fetch(
          `/api/wallet/withdrawal/verify/${reference}`
        );
        if (!response.ok) {
          throw new Error("Failed to verify withdrawal status");
        }

        const data = await response.json();
        setWithdrawalStatus(data.status);

        // If completed or failed, refresh wallet balance
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          refetchWallet();
          // Remove from localStorage
          localStorage.removeItem("pendingWithdrawalReference");
        } else if (data.status === "PENDING") {
          // Check again in 5 seconds if still pending
          setTimeout(() => checkWithdrawalStatus(reference), 5000);
        }

        return data.status;
      } catch (error) {
        logger.error("Error checking withdrawal status", { error, reference });
        // Don't remove from localStorage on error - we'll try again
        toast.error("Failed to check withdrawal status", {
          description:
            "We'll try again automatically. You can also close and reopen this dialog.",
        });
        // Try again in 10 seconds
        setTimeout(() => checkWithdrawalStatus(reference), 10000);
        return null;
      } finally {
        setIsCheckingStatus(false);
      }
    },
    [refetchWallet, isCheckingStatus]
  );

  // Manual refresh of withdrawal status
  const handleManualRefresh = () => {
    if (withdrawalReference) {
      checkWithdrawalStatus(withdrawalReference);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Don't proceed if account resolution failed
    if (accountError || !accountName) {
      toast.error("Invalid account details", {
        description: "Please verify your account number and bank",
      });
      return;
    }

    // Don't proceed if amount exceeds balance
    if (walletData?.balance && values.amount > walletData.balance) {
      toast.error("Insufficient balance", {
        description: `Your withdrawal amount exceeds your wallet balance of ₦${walletData.balance.toLocaleString()}`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "withdrawal",
          amount: values.amount,
          bankCode: values.bankCode,
          accountNumber: values.accountNumber,
          accountName: accountName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process withdrawal");
      }

      const result = await response.json();
      setWithdrawalReference(result.reference);
      setWithdrawalStatus("PENDING");

      // Save to localStorage to recover from page refreshes
      localStorage.setItem("pendingWithdrawalReference", result.reference);

      // Start checking status
      setTimeout(() => checkWithdrawalStatus(result.reference), 3000);

      toast.success("Withdrawal initiated", {
        description:
          "Your withdrawal request has been submitted and is being processed.",
      });

      // Refresh wallet balance
      refetchWallet();
    } catch (error) {
      logger.error("Withdrawal error", { error });
      toast.error("Withdrawal failed", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Reset the form and close modal
  const handleClose = () => {
    if (!isLoading) {
      form.reset();
      setAccountName("");
      setAccountError("");

      // Only clear withdrawal reference if it's completed or failed
      if (withdrawalStatus === "COMPLETED" || withdrawalStatus === "FAILED") {
        setWithdrawalReference(null);
        setWithdrawalStatus(null);
        localStorage.removeItem("pendingWithdrawalReference");
      }

      setOpen(false);
      router.refresh();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isLoading || !newOpen) setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Withdraw</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Withdraw funds from your wallet to your bank account.
          </DialogDescription>
        </DialogHeader>

        {withdrawalReference ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {withdrawalStatus === "COMPLETED"
                  ? "Withdrawal Completed"
                  : withdrawalStatus === "FAILED"
                    ? "Withdrawal Failed"
                    : "Withdrawal Processing"}
              </AlertTitle>
              <AlertDescription>
                {withdrawalStatus === "COMPLETED"
                  ? "Your withdrawal has been processed successfully. The funds should appear in your bank account shortly."
                  : withdrawalStatus === "FAILED"
                    ? "Your withdrawal could not be processed. The funds have been returned to your wallet."
                    : "Your withdrawal is being processed. This may take a few minutes."}
              </AlertDescription>
            </Alert>

            {withdrawalStatus === "PENDING" && (
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isCheckingStatus}
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Status
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  You can close this dialog and check your transaction history
                  later. Your withdrawal will continue processing.
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>Reference: {withdrawalReference}</p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>
                {withdrawalStatus === "PENDING"
                  ? "Close (Processing in Background)"
                  : "Close"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1000"
                        step="100"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum withdrawal amount is ₦1,000.
                      {walletData?.balance !== undefined && (
                        <>
                          {" "}
                          Your balance: ₦{walletData.balance.toLocaleString()}
                        </>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isFetchingBanks}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              isFetchingBanks
                                ? "Loading banks..."
                                : "Select your bank"
                            }
                            className="w-full"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full">
                        {banks.map((bank) => (
                          <SelectItem
                            className="w-full"
                            key={bank.code}
                            value={bank.code}
                          >
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter your account number"
                        maxLength={10}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isResolvingAccount && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying account...</span>
                </div>
              )}

              {accountName && !isResolvingAccount && (
                <Alert className="bg-green-500/20 border-green-500">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-500">
                    Account Name:{" "}
                    <span className="font-medium">{accountName}</span>
                  </AlertDescription>
                </Alert>
              )}

              {accountError && !isResolvingAccount && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{accountError}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    isResolvingAccount ||
                    !accountName ||
                    !!accountError ||
                    (walletData?.balance !== undefined &&
                      watchAmount > walletData.balance)
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Withdraw"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
