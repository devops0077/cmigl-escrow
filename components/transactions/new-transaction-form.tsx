"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserSearch } from "@/components/transactions/user-search";
import { createTransaction } from "@/lib/data-actions";
import { toast } from "sonner";
import { FadeIn } from "@/components/animations/fade-in";
import { PaystackScript } from "@/components/payments/paystack-script";
import { PaystackButton } from "@/components/payments/paystack-button";
import { useSession } from "next-auth/react";

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
  productCategory: z.string().min(1, {
    message: "Please select a product category.",
  }),
});

// Define product categories
const productCategories = [
  { id: "1", name: "Electronics" },
  { id: "2", name: "Fashion" },
  { id: "3", name: "Home & Garden" },
  { id: "4", name: "Health & Beauty" },
  { id: "5", name: "Sports & Outdoors" },
  { id: "6", name: "Toys & Games" },
  { id: "7", name: "Automotive" },
  { id: "8", name: "Digital Services" },
  { id: "9", name: "Other" },
];

export function NewTransactionForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [paymentStep, setPaymentStep] = useState<"form" | "payment">("form");
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
      productCategory: "",
    },
  });

  // Calculate fee whenever amount changes
  const amount = form.watch("amount");
  useEffect(() => {
    if (amount > 0) {
      setCalculatedFee(amount * 0.015); // 1.5% fee
    } else {
      setCalculatedFee(0);
    }
  }, [amount]);

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
          productCategory: values.productCategory,
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
        const reference = `TX-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

        setPaymentData({
          reference,
          amount: Math.round(totalAmount * 100), // Convert to kobo
          email: session.user.email,
          transactionData: values,
        });

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
        productCategory: paymentData.transactionData.productCategory,
        paymentReference: reference,
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
                          Enter the amount to be held in escrow. A 1.5% fee (₦
                          {calculatedFee.toFixed(2)}) will be applied.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productCategory"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Product Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="w-full">
                            {productCategories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.name}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the category that best describes the product or
                          service.
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
                    Total Amount: ₦
                    {paymentData
                      ? (paymentData.amount / 100).toFixed(2)
                      : "0.00"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Transaction Amount: ₦
                    {paymentData?.transactionData.amount.toFixed(2) || "0.00"} +
                    Fee: ₦
                    {(paymentData?.transactionData.amount * 0.015).toFixed(2) ||
                      "0.00"}
                  </p>
                </div>
                <div className="flex justify-center">
                  {paymentData && (
                    <PaystackButton
                      amount={paymentData.amount}
                      email={paymentData.email}
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
                A flat 1.5% fee will be deducted from the transaction amount.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </FadeIn>
  );
}
