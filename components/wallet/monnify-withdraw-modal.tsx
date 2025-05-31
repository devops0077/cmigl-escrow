"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  X,
  ChevronRight,
  Star,
  TrendingUp,
  Zap,
  ArrowDown,
  DollarSign,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import apiClient from "@/lib/api-client";

// Bank type definition with enhanced properties
type Bank = {
  code: string;
  name: string;
  slug?: string;
  active?: boolean;
  popular?: boolean;
  category?: "tier1" | "tier2" | "digital" | "microfinance";
};

// Enhanced bank data with categories and popularity
const POPULAR_BANKS = ["044", "058", "011", "214", "221", "033"];
const TIER1_BANKS = ["044", "058", "011", "214", "221", "033", "070"];
const DIGITAL_BANKS = ["100004", "100039", "100033", "999992", "100005"];

// Withdrawal steps enum
enum WithdrawalStep {
  AMOUNT = "amount",
  BANK_SELECTION = "bank_selection",
  ACCOUNT_DETAILS = "account_details",
  CONFIRMATION = "confirmation",
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

// Quick amount suggestions with labels
const QUICK_AMOUNTS = [
  { amount: 5000, label: "5K" },
  { amount: 10000, label: "10K" },
  { amount: 25000, label: "25K" },
  { amount: 50000, label: "50K" },
  { amount: 100000, label: "100K" },
];

export function MonnifyWithdrawModal() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<WithdrawalStep>(
    WithdrawalStep.AMOUNT
  );
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [selectedBankCategory, setSelectedBankCategory] =
    useState<string>("all");
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

  // Enhanced bank categorization
  const categorizedBanks = useMemo(() => {
    const enhancedBanks = banks.map((bank) => ({
      ...bank,
      popular: POPULAR_BANKS.includes(bank.code),
      category: TIER1_BANKS.includes(bank.code)
        ? "tier1"
        : DIGITAL_BANKS.includes(bank.code)
          ? "digital"
          : "tier2",
    })) as Bank[];

    const filtered = bankSearchQuery
      ? enhancedBanks.filter((bank) =>
          bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
        )
      : enhancedBanks;

    if (selectedBankCategory === "all") return filtered;
    if (selectedBankCategory === "popular")
      return filtered.filter((bank) => bank.popular);
    return filtered.filter((bank) => bank.category === selectedBankCategory);
  }, [banks, bankSearchQuery, selectedBankCategory]);

  // Selected bank details
  const selectedBank = useMemo(() => {
    return banks.find((bank) => bank.code === watchBankCode);
  }, [banks, watchBankCode]);

  // Form validation state
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case WithdrawalStep.AMOUNT:
        return (
          watchAmount >= 1000 &&
          (!walletData?.balance || watchAmount <= walletData.balance)
        );
      case WithdrawalStep.BANK_SELECTION:
        return !!watchBankCode;
      case WithdrawalStep.ACCOUNT_DETAILS:
        return (
          watchAccountNumber?.length === 10 && accountName && !accountError
        );
      case WithdrawalStep.CONFIRMATION:
        return true;
      default:
        return false;
    }
  }, [
    currentStep,
    watchAmount,
    watchBankCode,
    watchAccountNumber,
    accountName,
    accountError,
    walletData?.balance,
  ]);

  // Step progress calculation
  const stepProgress = useMemo(() => {
    const steps = Object.values(WithdrawalStep);
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  }, [currentStep]);

  // Initialize component
  useEffect(() => {
    if (open && banks.length === 0) {
      fetchBanks();
    }

    if (!open) {
      setWithdrawalReference(null);
      setWithdrawalStatus(null);
      setCurrentStep(WithdrawalStep.AMOUNT);
      setProcessingProgress(0);
      setBankSearchQuery("");
      setSelectedBankCategory("all");
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

  // Navigation functions
  const goToNextStep = () => {
    const steps = Object.values(WithdrawalStep);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const steps = Object.values(WithdrawalStep);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Quick amount selection
  const handleQuickAmount = (amount: number) => {
    form.setValue("amount", amount);
  };

  // Bank selection
  const handleBankSelect = (bankCode: string) => {
    form.setValue("bankCode", bankCode);
    goToNextStep();
  };

  // Manual refresh
  const handleManualRefresh = () => {
    if (withdrawalReference) {
      setProcessingProgress(0);
      checkWithdrawalStatus(withdrawalReference);
    }
  };

  // Form submission
  async function onSubmit() {
    if (accountError || !accountName) {
      toast.error("Invalid account details", {
        description: "Please verify your account number and bank",
      });
      return;
    }

    const values = form.getValues();

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
      const response = await apiClient.post("/wallet/monnify-withdrawal", {
        type: "monnify_withdrawal",
        amount: Number(values.amount),
        bankCode: values.bankCode,
        accountNumber: values.accountNumber,
        accountName: accountName,
      });

      setProcessingProgress(60);

      const result = await response.data;
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
      setCurrentStep(WithdrawalStep.AMOUNT);
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
      setSelectedBankCategory("all");

      if (withdrawalStatus === "COMPLETED" || withdrawalStatus === "FAILED") {
        setWithdrawalReference(null);
        setWithdrawalStatus(null);
        setCurrentStep(WithdrawalStep.AMOUNT);
        localStorage.removeItem("pendingMonnifyWithdrawalReference");
      }

      setOpen(false);
      router.refresh();
    }
  };

  // Render amount step
  const renderAmountStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary  rounded-full flex items-center justify-center mx-auto">
          <span className="h-8 w-8 text-2xl text-white">₦</span>
        </div>
        <h3 className="text-xl font-semibold">
          How much would you like to withdraw?
        </h3>
        <p className="text-muted-foreground">
          Enter the amount you want to transfer to your bank account
        </p>
      </div>

      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                    ₦
                  </span>
                  <Input
                    type="number"
                    min="1000"
                    step="100"
                    placeholder="0.00"
                    className="pl-12 text-2xl font-bold h-16 text-center border-2 focus:border-primary"
                    {...field}
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-2">
                  {QUICK_AMOUNTS.map(({ amount, label }) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={watchAmount === amount ? "default" : "outline"}
                      size="sm"
                      className="h-12 flex flex-col gap-1"
                      onClick={() => handleQuickAmount(amount)}
                      disabled={
                        walletData?.balance
                          ? amount > walletData.balance
                          : false
                      }
                    >
                      <span className="text-xs font-medium">{label}</span>
                      <span className="text-xs opacity-70">
                        ₦{amount.toLocaleString()}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </FormControl>
            <FormDescription className="text-center">
              <div className="flex items-center justify-between">
                <span>Minimum: ₦1,000</span>
                {walletData?.balance !== undefined && (
                  <span className="font-medium text-primary">
                    Balance: ₦{walletData.balance.toLocaleString()}
                  </span>
                )}
              </div>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );

  // Render bank selection step
  const renderBankSelectionStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-2"
    >
      <div className="text-center space-y-1">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold">Select your bank</h3>
        <p className="text-muted-foreground">
          Choose the bank where you want to receive your funds
        </p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search banks..."
            value={bankSearchQuery}
            onChange={(e) => setBankSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bank Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: "all", label: "All Banks", icon: Building2 },
            { key: "popular", label: "Popular", icon: Star },
            { key: "tier1", label: "Tier 1", icon: TrendingUp },
            { key: "digital", label: "Digital", icon: Zap },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={selectedBankCategory === key ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2 whitespace-nowrap"
              onClick={() => setSelectedBankCategory(key)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Banks List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isFetchingBanks ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : categorizedBanks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No banks found</p>
          </div>
        ) : (
          <AnimatePresence>
            {categorizedBanks.map((bank, index) => (
              <motion.div
                key={bank.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50",
                    watchBankCode === bank.code && "border-primary bg-primary/5"
                  )}
                  onClick={() => handleBankSelect(bank.code)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{bank.name}</h4>
                            {bank.popular && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {bank.code}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );

  // Render account details step
  const renderAccountDetailsStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
          <CreditCard className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold">Enter account details</h3>
        <p className="text-muted-foreground">
          Provide your account number for {selectedBank?.name}
        </p>
      </div>

      {/* Selected Bank Display */}
      {selectedBank && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium">{selectedBank.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedBank.code}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <FormField
        control={form.control}
        name="accountNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              Account Number
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter your 10-digit account number"
                  maxLength={10}
                  className="pr-10 h-12 text-lg"
                  {...field}
                />
                {isResolvingAccount && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Account Verification Status */}
      <AnimatePresence>
        {(isResolvingAccount || accountName || accountError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {isResolvingAccount && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <div>
                      <div className="font-medium">Verifying account...</div>
                      <div className="text-sm opacity-80">
                        Please wait while we verify your account details
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {accountName && !isResolvingAccount && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Account verified</div>
                      <div className="text-sm opacity-80">{accountName}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {accountError && !isResolvingAccount && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-red-600">
                    <X className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Verification failed</div>
                      <div className="text-sm opacity-80">{accountError}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Render confirmation step
  const renderConfirmationStep = () => {
    const values = form.getValues();
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Confirm withdrawal</h3>
          <p className="text-muted-foreground">
            Please review your withdrawal details before proceeding
          </p>
        </div>

        <Card className="border-2 border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(values.amount)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium">{selectedBank?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Number</span>
              <span className="font-mono">{values.accountNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-medium">{accountName}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Processing Fee</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 text-amber-600">
              <Shield className="h-5 w-5 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Secure Processing</div>
                <div className="opacity-80">
                  Your withdrawal will be processed securely via Monnify. Funds
                  typically arrive within minutes.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Render processing step
  const renderProcessingStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            <Clock className="h-10 w-10 text-white" />
          </motion.div>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Processing your withdrawal</h3>
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
        <Progress value={processingProgress} className="h-3" />
      </div>

      {withdrawalReference && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono text-xs">{withdrawalReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <Badge variant="outline" className="text-xs">
                  Monnify
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="secondary" className="text-xs">
                  Processing
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          onClick={handleManualRefresh}
          disabled={isCheckingStatus}
          className="w-full"
        >
          {isCheckingStatus ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking status...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh status
            </>
          )}
        </Button>
        <Button variant="ghost" onClick={handleClose} className="w-full">
          Close (Processing in background)
        </Button>
      </div>
    </motion.div>
  );

  // Render completed step
  const renderCompletedStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
            withdrawalStatus === "COMPLETED"
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          )}
        >
          {withdrawalStatus === "COMPLETED" ? (
            <CheckCircle2 className="h-10 w-10" />
          ) : (
            <X className="h-10 w-10" />
          )}
        </motion.div>
        <div>
          <h3 className="text-xl font-semibold">
            {withdrawalStatus === "COMPLETED"
              ? "Withdrawal completed!"
              : "Withdrawal failed"}
          </h3>
          <p className="text-muted-foreground">
            {withdrawalStatus === "COMPLETED"
              ? "Your funds have been successfully transferred to your bank account."
              : "Your withdrawal could not be processed. The funds have been returned to your wallet."}
          </p>
        </div>
      </div>

      <Button onClick={handleClose} className="w-full" size="lg">
        Close
      </Button>
    </motion.div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2" variant="default" size="lg">
          <ArrowDown className="h-4 w-4" />
          Withdraw
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="text-center pb-2">
          <SheetTitle className="flex items-center justify-center gap-2 text-xl">
            <Wallet className="h-6 w-6 text-primary" />
            Withdraw Funds
          </SheetTitle>
          <SheetDescription>
            Securely transfer funds from your wallet to your bank account
          </SheetDescription>

          {/* Progress Indicator */}
          {currentStep !== WithdrawalStep.PROCESSING &&
            currentStep !== WithdrawalStep.COMPLETED && (
              <div className="mt-4">
                <Progress value={stepProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>
                    Step{" "}
                    {Object.values(WithdrawalStep).indexOf(currentStep) + 1}
                  </span>
                  <span>of {Object.values(WithdrawalStep).length - 2}</span>
                </div>
              </div>
            )}
        </SheetHeader>

        <div className="px-4 pb-4 overflow-y-auto flex-1">
          <Form {...form}>
            <AnimatePresence mode="wait">
              {currentStep === WithdrawalStep.AMOUNT && renderAmountStep()}
              {currentStep === WithdrawalStep.BANK_SELECTION &&
                renderBankSelectionStep()}
              {currentStep === WithdrawalStep.ACCOUNT_DETAILS &&
                renderAccountDetailsStep()}
              {currentStep === WithdrawalStep.CONFIRMATION &&
                renderConfirmationStep()}
              {currentStep === WithdrawalStep.PROCESSING &&
                renderProcessingStep()}
              {currentStep === WithdrawalStep.COMPLETED &&
                renderCompletedStep()}
            </AnimatePresence>
          </Form>
        </div>

        {/* Navigation Footer */}
        {currentStep !== WithdrawalStep.PROCESSING &&
          currentStep !== WithdrawalStep.COMPLETED && (
            <SheetFooter>
              <div className="flex gap-3">
                {currentStep !== WithdrawalStep.AMOUNT && (
                  <Button
                    variant="outline"
                    onClick={goToPreviousStep}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                )}

                {currentStep === WithdrawalStep.CONFIRMATION ? (
                  <Button
                    onClick={onSubmit}
                    disabled={!isStepValid || isLoading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Confirm Withdrawal
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={goToNextStep}
                    disabled={!isStepValid}
                    className="flex-1"
                    size="lg"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>

              <SheetClose asChild>
                <Button variant="ghost" className="w-full">
                  Cancel
                </Button>
              </SheetClose>
            </SheetFooter>
          )}
      </SheetContent>
    </Sheet>
  );
}
