"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { WalletTransactions } from "@/components/wallet/wallet-transactions";
import { formatCurrency } from "@/lib/utils";
import {
  getUserWallet,
  depositToWallet,
  withdrawFromWallet,
} from "@/lib/wallet-actions";
import { toast } from "sonner";

const depositFormSchema = z.object({
  amount: z.coerce.number().positive({
    message: "Amount must be greater than 0.",
  }),
});

const withdrawFormSchema = z.object({
  amount: z.coerce.number().positive({
    message: "Amount must be greater than 0.",
  }),
  accountName: z.string().min(3, {
    message: "Account name must be at least 3 characters.",
  }),
  accountNumber: z
    .string()
    .length(10, {
      message: "Account number must be 10 digits.",
    })
    .regex(/^\d+$/, {
      message: "Account number must contain only digits.",
    }),
  bankName: z.string().min(2, {
    message: "Bank name is required.",
  }),
});

export default function WalletPage() {
  const { data: session, status } = useSession();
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const depositForm = useForm<z.infer<typeof depositFormSchema>>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const withdrawForm = useForm<z.infer<typeof withdrawFormSchema>>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues: {
      amount: 0,
      accountName: "",
      accountNumber: "",
      bankName: "",
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      const fetchWallet = async () => {
        try {
          const data = await getUserWallet();
          setWalletBalance(data.balance);
        } catch (error) {
          console.error("Error fetching wallet:", error);
          toast.error("Error", {
            description: "Could not load wallet information.",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchWallet();
    }
  }, [status, toast]);

  async function onDepositSubmit(values: z.infer<typeof depositFormSchema>) {
    setIsDepositing(true);
    try {
      const result = await depositToWallet(values.amount);

      // @ts-ignore
      if (result.redirectUrl) {
        // Redirect to payment gateway
        // @ts-ignore
        window.location.href = result.redirectUrl;
        return;
      }

      setWalletBalance(result.newBalance);
      toast.success("Deposit successful", {
        description: `${formatCurrency(
          values.amount
        )} has been added to your wallet.`,
      });

      depositForm.reset();
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Deposit failed", {
        description:
          error instanceof Error
            ? error.message
            : "There was a problem processing your deposit.",
      });
    } finally {
      setIsDepositing(false);
    }
  }

  async function onWithdrawSubmit(values: z.infer<typeof withdrawFormSchema>) {
    setIsWithdrawing(true);
    try {
      if (values.amount > walletBalance) {
        throw new Error("Insufficient funds in your wallet");
      }

      const result = await withdrawFromWallet({
        amount: values.amount,
        accountName: values.accountName,
        accountNumber: values.accountNumber,
        bankName: values.bankName,
      });

      setWalletBalance(result.newBalance);
      toast.success("Withdrawal initiated", {
        description: `Your withdrawal request for ${formatCurrency(
          values.amount
        )} has been submitted.`,
      });

      withdrawForm.reset();
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Withdrawal failed", {
        description:
          error instanceof Error
            ? error.message
            : "There was a problem processing your withdrawal.",
      });
    } finally {
      setIsWithdrawing(false);
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/login?callbackUrl=/wallet");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Wallet"
        text="Manage your funds and transaction history."
      />
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
            <CardDescription>Your current available balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {formatCurrency(walletBalance)}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </p>
          </CardFooter>
        </Card>
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Manage Funds</CardTitle>
            <CardDescription>
              Deposit or withdraw funds from your wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              </TabsList>
              <TabsContent value="deposit" className="space-y-4 pt-4">
                <Form {...depositForm}>
                  <form
                    onSubmit={depositForm.handleSubmit(onDepositSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={depositForm.control}
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
                            Enter the amount you want to deposit.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isDepositing}
                    >
                      {isDepositing ? "Processing..." : "Deposit Funds"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="withdraw" className="space-y-4 pt-4">
                <Form {...withdrawForm}>
                  <form
                    onSubmit={withdrawForm.handleSubmit(onWithdrawSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={withdrawForm.control}
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
                            Enter the amount you want to withdraw.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={withdrawForm.control}
                      name="accountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={withdrawForm.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="0123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={withdrawForm.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Bank Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isWithdrawing}
                    >
                      {isWithdrawing ? "Processing..." : "Withdraw Funds"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent activity in your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <WalletTransactions />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
