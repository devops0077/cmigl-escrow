"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
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
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { UserSearch } from "@/components/transactions/user-search";
import { createTransaction, getProductCategories } from "@/lib/data-actions";
import { toast } from "sonner";

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

export default function NewTransactionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<
    { id: string; name: string; percentage: number }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerId: "",
      amount: 0,
      productDetails: "",
      productCategory: "",
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getProductCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const transaction = await createTransaction({
        sellerId: values.sellerId,
        amount: values.amount,
        productDetails: values.productDetails,
        productCategory: values.productCategory,
      });

      toast.success("Transaction created", {
        description: "Your transaction has been created successfully.",
      });

      router.push(`/transactions/${transaction.id}`);
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

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/login?callbackUrl=/transactions/new");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="New Transaction"
        text="Create a new escrow transaction with a seller."
      />
      <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Enter the details of your transaction to create an escrow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="sellerId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Seller</FormLabel>
                      <UserSearch
                        onSelect={(user) => {
                          field.onChange(user.id);
                        }}
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
                        Enter the amount to be held in escrow.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Category</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedCategory(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name} ({category.percentage * 100}% fee)
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
                  {isLoading ? "Creating transaction..." : "Create Transaction"}
                </Button>
              </form>
            </Form>
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
                A small fee will be deducted from the transaction amount based
                on the product category.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
