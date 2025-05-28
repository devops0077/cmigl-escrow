"use client";

import { Label } from "@/components/ui/label";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { calculateTotalWithAllFees } from "@/lib/fee-calculator";

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

export function NewTransactionForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [paymentStep, setPaymentStep] = useState<"form" | "payment">("form");
  const [includeFees, setIncludeFees] = useState(false);
  const [feeBreakdown, setFeeBreakdown] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<{
    reference: string;
    amount: number;
    email: string;
    transactionData: any;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerId: "",
      amount: 0,
      productDetails: "",
    },
  });

  // Calculate fee whenever amount changes
  const amount = form.watch("amount");
  useEffect(() => {
    if (amount > 0) {
      // Calculate escrow fee
      const escrowFee = amount * _escrowConfig.escrowFee;
      setCalculatedFee(escrowFee);

      // Calculate total with Paystack fees if needed
      if (includeFees) {
        const calculation = calculateTotalWithAllFees(amount, false);
        setFeeBreakdown(calculation);
      } else {
        setFeeBreakdown(null);
      }
    } else {
      setCalculatedFee(0);
      setFeeBreakdown(null);
    }
  }, [amount, includeFees]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Check if user has sufficient wallet balance
      const walletResponse = await fetch("/api/wallet/balance");
      const walletData = await walletResponse.json();

      const totalAmount = values.amount + calculatedFee;

      if (walletData.balance >= totalAmount) {
        // User has sufficient balance, create transaction directly
        const transaction = await createTransaction({
          sellerId: values.sellerId,
          amount: values.amount,
          productDetails: values.productDetails,
        });

        toast.success("Transaction created", {
          description: "Your transaction has been created successfully.",
        });

        router.push(`/dashboard/transactions/${transaction.id}`);
      } else {
        // User needs to pay, initialize Paystack payment
        if (!session?.user?.email) {
          throw new Error("User email not available");
        }

        // Generate reference
        const reference = generateTransactionReference();

        // Calculate final amount including Paystack fees if needed
        let finalAmount = totalAmount;
        if (includeFees && feeBreakdown) {
          finalAmount = feeBreakdown.totalAmount;
        }

        setPaymentData({
          reference,
          amount: Math.round(finalAmount * 100), // Convert to kobo
          email: session.user.email,
          transactionData: {
            ...values,
            includeFees,
            feeBreakdown,
            escrowFee: calculatedFee,
            totalBeforeFees: totalAmount,
          },
        });

        setIncludeFees(true);
        if (paymentData) {
          setPaymentData({
            ...paymentData,
            transactionData: {
              ...paymentData.transactionData,
              includeFees: true,
              feeBreakdown,
               escrowFee: calculatedFee,
            totalBeforeFees: totalAmount,
            },
          });
        }
        setPaymentStep("payment");
      }
    } catch (error) {
      console.error("Transaction creation error:", error);
      toast.error("Transaction failed", {
        description:
          error instanceof Error
            ? error.message
            : "There was a problem creating your transaction. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handlePaymentSuccess = async (reference: string) => {
    if (!paymentData?.transactionData) return;

    setIsLoading(true);
    try {
      // Verify the payment
      const verificationResponse = await fetch(
        `/api/payments/verify/${reference}`
      );
      const verificationData = await verificationResponse.json();

      if (verificationData.data.status !== "success") {
        throw new Error("Payment verification failed");
      }

      // Create the transaction
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
          error instanceof Error
            ? error.message
            : "There was a problem creating your transaction. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentClose = () => {
    setPaymentStep("form");
    setIncludeFees(false);
    setPaymentData(null);
  };

  return (
    <FadeIn>
      <PaystackScript />
      <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Enter the details of your transaction to create an escrow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentStep === "form" ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="sellerId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col w-full">
                        <FormLabel>Seller</FormLabel>
                        <UserSearch
                          onSelect={(user) => {
                            field.onChange(!user ? "" : user.id);
                          }}
                          selectedUser={field.value}
                        />
                        <FormDescription>
                          Search for a seller by email or username.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₦)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the amount to be held in escrow. A{" "}
                          {_escrowConfig.escrowFee * 100}% fee (
                          {formatCurrency(calculatedFee)}) will be applied.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the product or service you're purchasing..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide details about what you're purchasing for
                          reference.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Paystack fee option */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeFees"
                      checked={includeFees}
                      onCheckedChange={(checked) =>
                        setIncludeFees(checked as boolean)
                      }
                      hidden
                    />
                    <Label htmlFor="includeFees" hidden className="text-sm">
                      Include Paystack transaction fees
                    </Label>
                  </div>

                  {/* Fee breakdown */}
                  {amount > 0 && (
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <p className="font-medium mb-1">Fee Breakdown:</p>
                      <p>Base Amount: {formatCurrency(amount)}</p>
                      <p>
                        Escrow Fee ({_escrowConfig.escrowFee * 100}%):{" "}
                        {formatCurrency(calculatedFee)}
                      </p>

                      {includeFees && feeBreakdown && (
                        <>
                          <p>
                            Paystack Fee:{" "}
                            {formatCurrency(feeBreakdown.paystackFee)}
                          </p>
                          <p className="font-medium mt-1">
                            Total: {formatCurrency(feeBreakdown.totalAmount)}
                          </p>
                        </>
                      )}

                      {!includeFees && (
                        <p className="font-medium mt-1">
                          Total:{" "}
                          {formatCurrency(Number(amount) + calculatedFee)}
                        </p>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading
                      ? "Creating transaction..."
                      : "Create Transaction"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <p className="text-lg font-medium">
                    Total Amount:
                    {paymentData
                      ? formatCurrency(paymentData.amount / 100)
                      : "₦0.00"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Transaction Amount:
                    {formatCurrency(paymentData?.transactionData.amount) ||
                      "₦0.00"}{" "}
                    + Fee:
                    {formatCurrency(
                      paymentData?.transactionData.escrowFee || 0
                    ) || "₦0.00"}
                    {paymentData?.transactionData.includeFees && (
                      <>
                        {" "}
                        + Paystack Fee:
                        {formatCurrency(
                          paymentData?.transactionData.feeBreakdown
                            ?.paystackFee || 0
                        ) || "₦0.00"}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex justify-center">
                  {paymentData && (
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
                      onClose={handlePaymentClose}
                    />
                  )}
                </div>
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={handlePaymentClose}>
                    Cancel Payment
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="col-span-2 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>
                The escrow process protects both buyers and sellers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">1. Create Transaction</h3>
                <p className="text-sm text-muted-foreground">
                  Fill out this form to create a new escrow transaction.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">2. Funds Held in Escrow</h3>
                <p className="text-sm text-muted-foreground">
                  The amount will be deducted from your wallet and held in
                  escrow.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">3. Seller Ships Product</h3>
                <p className="text-sm text-muted-foreground">
                  The seller will be notified and can ship the product to you.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">4. Confirm Receipt</h3>
                <p className="text-sm text-muted-foreground">
                  Once you receive the product, confirm receipt in the system.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">5. Funds Released</h3>
                <p className="text-sm text-muted-foreground">
                  After admin approval, funds are released to the seller.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                A flat {_escrowConfig.escrowFee * 100}% fee will be deducted
                from the transaction amount.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </FadeIn>
  );
}
