"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import {
  Loader2,
  CheckCircle2,
  RefreshCw,
  Search,
  Building2,
  CreditCard,
  ArrowRight,
  Wallet,
  Shield,
  Clock,
  Check,
  X,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// Bank type definition
type Bank = {
  code: string;
  name: string;
  slug?: string;
  active?: boolean;
};

// Withdrawal steps enum
enum WithdrawalStep {
  FORM = "form",
  PROCESSING = "processing",
  COMPLETED = "completed",
}

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

// Quick amount suggestions
const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

export function MonnifyWithdrawModal() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<WithdrawalStep>(
    WithdrawalStep.FORM
  );
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);
  const [bankSearchOpen, setBankSearchOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [withdrawalReference, setWithdrawalReference] = useState<string | null>(
    null
  );
  const [withdrawalStatus, setWithdrawalStatus] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { data: walletData, refetch: refetchWallet } = useWallet();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      bankCode: "",
      accountNumber: "",
    },
  });

  // Watch for form changes
  const watchBankCode = form.watch("bankCode");
  const watchAccountNumber = form.watch("accountNumber");
  const watchAmount = form.watch("amount");

  // Memoized filtered banks for search
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const filteredBanks = useMemo(() => {
    if (!bankSearchQuery) return banks;
    return banks.filter((bank) =>
      bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
    );
  }, [banks, bankSearchQuery]);

  // Selected bank details
  const selectedBank = useMemo(() => {
    return banks.find((bank) => bank.code === watchBankCode);
  }, [banks, watchBankCode]);

  // Form validation state
  const isFormValid = useMemo(() => {
    return (
      watchAmount >= 1000 &&
      watchBankCode &&
      watchAccountNumber?.length === 10 &&
      accountName &&
      !accountError &&
      (!walletData?.balance || watchAmount <= walletData.balance)
    );
  }, [
    watchAmount,
    watchBankCode,
    watchAccountNumber,
    accountName,
    accountError,
    walletData?.balance,
  ]);

  // Initialize component
  useEffect(() => {
    if (open && banks.length === 0) {
      fetchBanks();
    }

    if (!open) {
      setWithdrawalReference(null);
      setWithdrawalStatus(null);
      setCurrentStep(WithdrawalStep.FORM);
      setProcessingProgress(0);
    }
  }, [open, banks.length]);

  // Account resolution effect
  useEffect(() => {
    const accountNumber = watchAccountNumber;
    const bankCode = watchBankCode;

    setAccountName("");
    setAccountError("");

    if (accountNumber?.length === 10 && bankCode) {
      resolveAccountNumber(accountNumber, bankCode);
    }
  }, [watchAccountNumber, watchBankCode]);

  // Amount validation effect
  useEffect(() => {
    if (
      watchAmount &&
      walletData?.balance &&
      watchAmount > walletData.balance
    ) {
      form.setError("amount", {
        type: "manual",
        message: `Amount exceeds your wallet balance of ${formatCurrency(walletData.balance)}`,
      });
    } else {
      form.clearErrors("amount");
    }
  }, [watchAmount, walletData?.balance, form]);

  // Recovery system
  useEffect(() => {
    if (withdrawalReference) {
      localStorage.setItem(
        "pendingMonnifyWithdrawalReference",
        withdrawalReference
      );
    }

    if (withdrawalStatus === "COMPLETED" || withdrawalStatus === "FAILED") {
      localStorage.removeItem("pendingMonnifyWithdrawalReference");
    }
  }, [withdrawalReference, withdrawalStatus]);

  useEffect(() => {
    const pendingReference = localStorage.getItem(
      "pendingMonnifyWithdrawalReference"
    );
    if (pendingReference) {
      setWithdrawalReference(pendingReference);
      setWithdrawalStatus("PENDING");
      setCurrentStep(WithdrawalStep.PROCESSING);
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

  // Check withdrawal status with progress simulation
  const checkWithdrawalStatus = useCallback(
    async (reference: string) => {
      if (!reference || isCheckingStatus) return;

      setIsCheckingStatus(true);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      try {
        const response = await fetch(
          `/api/wallet/monnify-withdrawal/verify/${reference}`
        );
        if (!response.ok) {
          throw new Error("Failed to verify withdrawal status");
        }

        const data = await response.json();
        setWithdrawalStatus(data.status);

        if (data.status === "COMPLETED") {
          setProcessingProgress(100);
          setCurrentStep(WithdrawalStep.COMPLETED);
          refetchWallet();
          localStorage.removeItem("pendingMonnifyWithdrawalReference");

          toast.success("Withdrawal completed!", {
            description:
              "Your funds have been successfully transferred to your bank account.",
          });
        } else if (data.status === "FAILED") {
          setProcessingProgress(100);
          setCurrentStep(WithdrawalStep.COMPLETED);
          refetchWallet();
          localStorage.removeItem("pendingMonnifyWithdrawalReference");

          toast.error("Withdrawal failed", {
            description: "Your funds have been returned to your wallet.",
          });
        } else if (data.status === "PENDING") {
          setTimeout(() => checkWithdrawalStatus(reference), 5000);
        }

        clearInterval(progressInterval);
        return data.status;
      } catch (error) {
        clearInterval(progressInterval);
        logger.error("Error checking withdrawal status", { error, reference });
        toast.error("Failed to check withdrawal status", {
          description: "We'll try again automatically.",
        });
        setTimeout(() => checkWithdrawalStatus(reference), 10000);
        return null;
      } finally {
        setIsCheckingStatus(false);
      }
    },
    [refetchWallet, isCheckingStatus]
  );

  // Manual refresh
  const handleManualRefresh = () => {
    if (withdrawalReference) {
      setProcessingProgress(0);
      checkWithdrawalStatus(withdrawalReference);
    }
  };

  // Quick amount selection
  const handleQuickAmount = (amount: number) => {
    form.setValue("amount", amount);
  };

  // Form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (accountError || !accountName) {
      toast.error("Invalid account details", {
        description: "Please verify your account number and bank",
      });
      return;
    }

    if (walletData?.balance && values.amount > walletData.balance) {
      toast.error("Insufficient balance", {
        description: `Your withdrawal amount exceeds your wallet balance of ₦${walletData.balance.toLocaleString()}`,
      });
      return;
    }

    setIsLoading(true);
    setCurrentStep(WithdrawalStep.PROCESSING);
    setProcessingProgress(20);

    try {
      const response = await fetch("/api/wallet/monnify-withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "monnify_withdrawal",
          amount: values.amount,
          bankCode: values.bankCode,
          accountNumber: values.accountNumber,
          accountName: accountName,
        }),
      });

      setProcessingProgress(60);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process withdrawal");
      }

      const result = await response.json();
      setWithdrawalReference(result.reference);
      setWithdrawalStatus("PENDING");
      setProcessingProgress(80);

      localStorage.setItem(
        "pendingMonnifyWithdrawalReference",
        result.reference
      );

      setTimeout(() => checkWithdrawalStatus(result.reference), 3000);

      toast.success("Withdrawal initiated", {
        description: "Your withdrawal request has been submitted via Monnify.",
      });

      refetchWallet();
    } catch (error) {
      logger.error("Monnify withdrawal error", { error });
      setCurrentStep(WithdrawalStep.FORM);
      setProcessingProgress(0);

      toast.error("Withdrawal failed", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Close handler
  const handleClose = () => {
    if (!isLoading) {
      form.reset();
      setAccountName("");
      setAccountError("");
      setBankSearchQuery("");

      if (withdrawalStatus === "COMPLETED" || withdrawalStatus === "FAILED") {
        setWithdrawalReference(null);
        setWithdrawalStatus(null);
        setCurrentStep(WithdrawalStep.FORM);
        localStorage.removeItem("pendingMonnifyWithdrawalReference");
      }

      setOpen(false);
      router.refresh();
    }
  };

  // Render bank selection skeleton
  const BankSelectionSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-10 w-full" />
    </div>
  );

  // Render form step
  const renderFormStep = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Field with Quick Selection */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Withdrawal Amount
              </FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      ₦
                    </span>
                    <Input
                      type="number"
                      min="1000"
                      step="100"
                      placeholder="0.00"
                      className="pl-8 text-lg font-medium"
                      {...field}
                    />
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleQuickAmount(amount)}
                        disabled={
                          walletData?.balance
                            ? amount > walletData.balance
                            : false
                        }
                      >
                        ₦{amount.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormDescription className="flex items-center justify-between">
                <span>Minimum: ₦1,000</span>
                {walletData?.balance !== undefined && (
                  <span className="font-medium">
                    Balance: ₦{walletData.balance.toLocaleString()}
                  </span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Enhanced Bank Selection */}
        <FormField
          control={form.control}
          name="bankCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Select Bank
              </FormLabel>
              {isFetchingBanks ? (
                <BankSelectionSkeleton />
              ) : (
                <Popover open={bankSearchOpen} onOpenChange={setBankSearchOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={bankSearchOpen}
                        className={cn(
                          "w-full justify-between h-12",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {selectedBank ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                              <Building2 className="h-3 w-3 text-primary" />
                            </div>
                            <span className="truncate">
                              {selectedBank.name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            <span>Search and select your bank</span>
                          </div>
                        )}
                        <ArrowRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search banks..."
                        value={bankSearchQuery}
                        onValueChange={setBankSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No banks found.</CommandEmpty>
                        <CommandGroup>
                          {filteredBanks.map((bank) => (
                            <CommandItem
                              key={bank.code}
                              value={bank.name}
                              onSelect={() => {
                                form.setValue("bankCode", bank.code);
                                setBankSearchOpen(false);
                                setBankSearchQuery("");
                              }}
                              className="flex items-center gap-2 p-3"
                            >
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{bank.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {bank.code}
                                </div>
                              </div>
                              {field.value === bank.code && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account Number with Enhanced Validation */}
        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Account Number
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter your 10-digit account number"
                    maxLength={10}
                    className="pr-10"
                    {...field}
                  />
                  {isResolvingAccount && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account Verification Status */}
        {(isResolvingAccount || accountName || accountError) && (
          <div className="space-y-1">
            {isResolvingAccount && (
              <Card className="border-blue-200 dark:bg-blue-900 bg-blue-100">
                <CardContent className="p-1">
                  <div className="flex items-center gap-2 text-blue-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">
                      Verifying account details...
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {accountName && !isResolvingAccount && (
              <Card className="border-green-200 dark:bg-green-900 bg-green-100">
                <CardContent className="p-1">
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">
                        Account Verified
                      </div>
                      <div className="text-sm">{accountName}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {accountError && !isResolvingAccount && (
              <Card className="border-red-200 dark:bg-red-900 bg-red-100">
                <CardContent className="p-1">
                  <div className="flex items-center gap-2 text-red-500">
                    <X className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">
                        Verification Failed
                      </div>
                      <div className="text-sm">{accountError}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Security Notice */}
        <Card className="border-amber-200 dark:bg-amber-900 bg-amber-100">
          <CardContent className="p-1">
            <div className="flex items-start gap-2 text-amber-500">
              <Shield className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Secure Processing</div>
                <div>
                  Your withdrawal will be processed securely. Ensure your
                  account details are correct.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full sm:w-auto"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Withdraw ₦{watchAmount?.toLocaleString() || 0}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  // Render processing step
  const renderProcessingStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Clock className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Processing Your Withdrawal</h3>
          <p className="text-muted-foreground">
            Your withdrawal is being processed. This may take a few minutes.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{processingProgress}%</span>
        </div>
        <Progress value={processingProgress} className="h-2" />
      </div>

      {withdrawalReference && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono">{withdrawalReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <Badge variant="outline">Monnify</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={handleManualRefresh}
          disabled={isCheckingStatus}
          className="flex-1"
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
        <Button variant="ghost" onClick={handleClose} className="flex-1">
          Close (Processing in Background)
        </Button>
      </div>
    </div>
  );

  // Render completed step
  const renderCompletedStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
            withdrawalStatus === "COMPLETED"
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          )}
        >
          {withdrawalStatus === "COMPLETED" ? (
            <CheckCircle2 className="h-8 w-8" />
          ) : (
            <X className="h-8 w-8" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {withdrawalStatus === "COMPLETED"
              ? "Withdrawal Completed!"
              : "Withdrawal Failed"}
          </h3>
          <p className="text-muted-foreground">
            {withdrawalStatus === "COMPLETED"
              ? "Your funds have been successfully transferred to your bank account."
              : "Your withdrawal could not be processed. The funds have been returned to your wallet."}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={handleClose} className="w-full" size="lg">
          Close
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isLoading || !newOpen) setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="h-4 w-4" />
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Securely withdraw funds from your wallet to your bank account using
            secure payment infrastructure.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {currentStep === WithdrawalStep.FORM && renderFormStep()}
          {currentStep === WithdrawalStep.PROCESSING && renderProcessingStep()}
          {currentStep === WithdrawalStep.COMPLETED && renderCompletedStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
