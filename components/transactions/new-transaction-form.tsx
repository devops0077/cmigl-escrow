"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { UserSearch } from "@/components/transactions/user-search";
import { createTransaction } from "@/lib/data-actions";
import { toast } from "sonner";
import { FadeIn } from "@/components/animations/fade-in";
import { PaystackScript } from "@/components/payments/paystack-script";
import { PaystackButton } from "@/components/payments/paystack-button";
import { useSession } from "next-auth/react";
import { _escrowConfig } from "@/config";
import { formatCurrency, generateTransactionReference } from "@/lib/utils";
import { calculateTotalWithAllFees } from "@/lib/fee-calculator";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { InsufficientFundsModal } from "@/components/transactions/insufficient-funds-modal";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  CreditCard,
  DollarSign,
  FileText,
  Shield,
  User,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CreditCardIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  sellerId: z.string().min(1, {
    message: "Please select a seller.",
  }),
  amount: z.coerce.number().positive({
    message: "Amount must be greater than 0.",
  }),
  productDetails: z.string().min(10, {
    message: "Product details must be at least 10 characters.",
  }),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  {
    id: 1,
    title: "Select Seller",
    description: "Choose who you're transacting with",
    icon: User,
  },
  {
    id: 2,
    title: "Transaction Details",
    description: "Set amount and describe the transaction",
    icon: CreditCardIcon,
  },
  {
    id: 3,
    title: "Product Information",
    description: "Provide details about what you're purchasing",
    icon: FileText,
  },
  {
    id: 4,
    title: "Review & Confirm",
    description: "Review all details before creating",
    icon: CheckCircle,
  },
];

export function NewTransactionForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: walletData, isLoading: walletLoading } = useWalletBalance();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [feeBreakdown, setFeeBreakdown] = useState<any>(null);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<{
    reference: string;
    amount: number;
    email: string;
    transactionData: any;
  } | null>(null);
  const searchParams = useSearchParams();
  const fromWalletFunding = searchParams.get("from") === "wallet-funding";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerId: "",
      amount: 0,
      productDetails: "",
    },
  });

  const amount = form.watch("amount");
  const sellerId = form.watch("sellerId");
  const productDetails = form.watch("productDetails");

  // Calculate fees when amount changes
  useEffect(() => {
    if (amount > 0) {
      const escrowFee = amount * _escrowConfig.escrowFee;
      setCalculatedFee(escrowFee);

      const calculation = calculateTotalWithAllFees(amount, false);
      setFeeBreakdown(calculation);
    } else {
      setCalculatedFee(0);
      setFeeBreakdown(null);
    }
  }, [amount]);

  useEffect(() => {
    if (fromWalletFunding) {
      try {
        const savedData = localStorage.getItem("pendingTransaction");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          form.setValue("sellerId", parsedData.sellerId);
          form.setValue("amount", parsedData.amount);
          form.setValue("productDetails", parsedData.productDetails);
          setSelectedUser(parsedData.selectedUser);
          setCurrentStep(4); // Go directly to review step

          // Clear the saved data after restoring
          localStorage.removeItem("pendingTransaction");

          toast.info("Transaction details restored", {
            description: "You can now complete your transaction.",
          });
        }
      } catch (error) {
        console.error("Error restoring transaction data:", error);
      }
    }
  }, [fromWalletFunding, form]);

  const totalRequired = Number(amount) + calculatedFee;
  const hasInsufficientFunds = walletData && totalRequired > walletData.balance;

  const handleNext = () => {
    if (currentStep < steps.length) {
      // Validate current step
      if (currentStep === 1 && !sellerId) {
        form.setError("sellerId", { message: "Please select a seller" });
        return;
      }
      if (currentStep === 2 && (!amount || amount <= 0)) {
        form.setError("amount", { message: "Please enter a valid amount" });
        return;
      }
      if (
        currentStep === 3 &&
        (!productDetails || productDetails.length < 10)
      ) {
        form.setError("productDetails", {
          message: "Please provide more details",
        });
        return;
      }

      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const checkBalanceAndProceed = () => {
    if (hasInsufficientFunds) {
      setShowInsufficientFunds(true);
      return;
    }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const values = form.getValues();

      if (walletData && totalRequired <= walletData.balance) {
        // User has sufficient balance, create transaction directly
        const transaction = await createTransaction({
          sellerId: values.sellerId,
          amount: Number(values.amount),
          productDetails: values.productDetails.trim(),
        });

        toast.success("Transaction created", {
          description: "Your transaction has been created successfully.",
        });

        router.push(`/dashboard/transactions/${transaction.id}`);
      } else {
        // User needs to pay via Paystack
        if (!session?.user?.email) {
          throw new Error("User email not available");
        }

        const reference = generateTransactionReference();
        const finalAmount = feeBreakdown
          ? feeBreakdown.totalAmount
          : totalRequired;

        setPaymentData({
          reference,
          amount: Math.round(finalAmount * 100), // Convert to kobo
          email: session.user.email,
          transactionData: {
            ...values,
            feeBreakdown,
            escrowFee: calculatedFee,
            totalBeforeFees: totalRequired,
          },
        });
      }
    } catch (error) {
      console.error("Transaction creation error:", error);

      toast.error("Transaction failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    if (!paymentData?.transactionData) return;

    setIsLoading(true);
    try {
      const verificationResponse = await fetch(
        `/api/payments/verify/${reference}`
      );
      const verificationData = await verificationResponse.json();

      if (verificationData.data.status !== "success") {
        throw new Error("Payment verification failed");
      }

      const transaction = await createTransaction({
        sellerId: paymentData.transactionData.sellerId,
        amount: paymentData.transactionData.amount,
        productDetails: paymentData.transactionData.productDetails,
      });

      toast.success("Transaction created", {
        description: "Your transaction has been created successfully.",
      });

      router.push(`/dashboard/transactions/${transaction.id}`);
    } catch (error) {
      console.error("Transaction creation error after payment:", error);
      toast.error("Transaction failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentData) {
    return (
      <FadeIn>
        <PaystackScript />
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CreditCard className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle>Complete Payment</CardTitle>
            <CardDescription>
              Total Amount: {formatCurrency(paymentData.amount / 100)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <PaystackButton
                amount={paymentData.amount / 100}
                email={paymentData.email}
                metadata={{
                  type: "transaction",
                  values: paymentData.transactionData,
                  ref: paymentData.reference,
                }}
                reference={paymentData.reference}
                onSuccess={handlePaymentSuccess}
                onClose={() => setPaymentData(null)}
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPaymentData(null)}
            >
              Cancel Payment
            </Button>
          </CardContent>
        </Card>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>
                  Step {currentStep} of {steps.length}
                </span>
                <span>
                  {Math.round((currentStep / steps.length) * 100)}% Complete
                </span>
              </div>
              <Progress
                value={(currentStep / steps.length) * 100}
                className="h-2"
              />

              <div className="flex justify-between">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStep;
                  const isCompleted = step.id < currentStep;

                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center space-y-1"
                    >
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs
                        ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-muted text-muted-foreground"
                        }
                      `}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span
                        className={`text-xs text-center max-w-16 ${
                          isActive
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form className="space-y-6">
                {/* Step 1: Select Seller */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <User className="h-12 w-12 mx-auto text-primary" />
                      <h3 className="text-lg font-semibold">Select Seller</h3>
                      <p className="text-muted-foreground">
                        Choose the person you want to create an escrow
                        transaction with
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="sellerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Search for Seller</FormLabel>
                          <UserSearch
                            onSelect={(user) => {
                              field.onChange(user ? user.id : null);
                              setSelectedUser(user ?? null);
                            }}
                            selectedUser={field.value ?? null}
                          />
                          <FormDescription>
                            Search by email or username to find the seller
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Transaction Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <span className="text-5xl mx-auto text-primary">₦</span>
                      <h3 className="text-lg font-semibold">
                        Transaction Amount
                      </h3>
                      <p className="text-muted-foreground">
                        Enter the amount to be held in escrow
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₦)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                ₦
                              </span>
                              <Input
                                type="number"
                                min="100"
                                step="100"
                                placeholder="0.00"
                                className="pl-8 text-lg"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Balance Check Alert */}
                    {!walletLoading && walletData && (
                      <Alert
                        className={
                          hasInsufficientFunds
                            ? "border-destructive"
                            : "border-green-500"
                        }
                      >
                        <AlertCircle
                          className={`h-4 w-4 ${hasInsufficientFunds ? "text-destructive" : "text-green-500"}`}
                        />
                        <AlertDescription>
                          <div className="flex justify-between items-center">
                            <span>
                              Wallet Balance:{" "}
                              <strong>
                                {formatCurrency(walletData.balance)}
                              </strong>
                            </span>
                            {hasInsufficientFunds && (
                              <Badge variant="destructive" className="ml-2">
                                Insufficient Funds
                              </Badge>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Fee Breakdown */}
                    {amount > 0 && (
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Fee Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Transaction Amount:</span>
                            <span>{formatCurrency(amount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>
                              Escrow Fee ({_escrowConfig.escrowFee * 100}%):
                            </span>
                            <span>{formatCurrency(calculatedFee)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Total Required:</span>
                            <span>{formatCurrency(totalRequired)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Step 3: Product Information */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <FileText className="h-12 w-12 mx-auto text-primary" />
                      <h3 className="text-lg font-semibold">Product Details</h3>
                      <p className="text-muted-foreground">
                        Describe what you're purchasing for reference
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="productDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product/Service Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the product or service you're purchasing..."
                              className="min-h-[120px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum 10 characters. Be specific to avoid
                            disputes.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 4: Review & Confirm */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <CheckCircle className="h-12 w-12 mx-auto text-primary" />
                      <h3 className="text-lg font-semibold">
                        Review Transaction
                      </h3>
                      <p className="text-muted-foreground">
                        Please review all details before creating the
                        transaction
                      </p>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Transaction Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Seller:
                            </span>
                            <p className="font-medium">
                              {selectedUser?.name ||
                                selectedUser?.email ||
                                "Selected"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Amount:
                            </span>
                            <p className="font-medium">
                              {formatCurrency(amount)}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <span className="text-muted-foreground text-sm">
                            Product Details:
                          </span>
                          <p className="text-sm mt-1 p-2 bg-muted rounded">
                            {productDetails}
                          </p>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Transaction Amount:</span>
                            <span>{formatCurrency(amount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Escrow Fee:</span>
                            <span>{formatCurrency(calculatedFee)}</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-2">
                            <span>Total:</span>
                            <span>{formatCurrency(totalRequired)}</span>
                          </div>
                        </div>

                        {hasInsufficientFunds && (
                          <Alert className="border-destructive">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <AlertDescription>
                              Insufficient wallet balance. You'll be redirected
                              to payment.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={checkBalanceAndProceed}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? "Creating..." : "Create Transaction"}
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Insufficient Funds Modal */}
        <InsufficientFundsModal
          isOpen={showInsufficientFunds}
          onClose={() => setShowInsufficientFunds(false)}
          requiredAmount={Math.round(totalRequired)}
          currentBalance={walletData?.balance || 0}
          onFundWallet={(shortfall) => {
            // Save current transaction data to localStorage
            const transactionData = {
              sellerId: form.getValues("sellerId"),
              amount: form.getValues("amount"),
              productDetails: form.getValues("productDetails"),
              selectedUser: selectedUser,
            };
            localStorage.setItem(
              "pendingTransaction",
              JSON.stringify(transactionData)
            );
            router.push(
              `/dashboard/wallet/?amount=${shortfall}&modal=true&returnUrl=/dashboard/transactions/new?from=wallet-funding`
            );
          }}
        />
      </div>
    </FadeIn>
  );
}
