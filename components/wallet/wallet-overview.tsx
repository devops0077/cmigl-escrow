"use client";

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { useWalletTransactions } from "@/hooks/use-wallet-transactions";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, RefreshCw } from "lucide-react";
import { FundWalletModal } from "./fund-wallet-modal";
import { WithdrawModal } from "./withdraw-modal";
import { PaystackScript } from "../payments/paystack-script";
import { WalletTransactions } from "./wallet-transactions";
import { RewardHistory } from "./reward-history";
import { MonnifyScript } from "../payments/monnify-script";
import { MonnifyWithdrawModal } from "./monnify-withdraw-modal";

export function WalletOverview() {
  const {
    data: walletBalance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useWalletBalance();
  const {
    data: transactions,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = useWalletTransactions();

  useEffect(() => {
    // Refresh data when component mounts
    refetchBalance();
    refetchTransactions();
  }, [refetchBalance, refetchTransactions]);

  const handleRefresh = () => {
    refetchBalance();
    refetchTransactions();
  };

  return (
    <>
      <PaystackScript />
      <MonnifyScript />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4 md:p-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">
                Wallet Balance
              </CardTitle>
              <CardDescription>Your available funds</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isBalanceLoading
                ? "Loading..."
                : formatCurrency(walletBalance?.balance || 0)}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <FundWalletModal onSuccess={handleRefresh} />
            <MonnifyWithdrawModal />
          </CardFooter>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="w-full">
            <div className="space-y-4 w-full">
              <div className="flex items-center w-full">
                <div className="mr-2 rounded-full bg-green-100 p-1 dark:bg-green-900">
                  <ArrowUpIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-sm font-medium">Deposits</div>
                <div className="ml-auto text-sm font-medium">
                  {isTransactionsLoading
                    ? "..."
                    : formatCurrency(
                        transactions?.data
                          .filter((t) => t.type === "DEPOSIT")
                          .reduce((acc, t) => acc + t.amount, 0) || 0
                      )}
                </div>
              </div>
              <div className="flex items-center">
                <div className="mr-2 rounded-full bg-red-100 p-1 dark:bg-red-900">
                  <ArrowDownIcon className="h-3 w-3 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-sm font-medium">Withdrawals</div>
                <div className="ml-auto text-sm font-medium">
                  {isTransactionsLoading
                    ? "..."
                    : formatCurrency(
                        transactions?.data
                          ?.filter((t) => t.type === "WITHDRAWAL")
                          .reduce((acc, t) => acc + t.amount, 0) || 0
                      )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="col-span-full mt-6">
          <RewardHistory />
        </div>
      </div>
      <div className="p-4 md:p-6">
        <Card className="mt-4 ">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent activity in your wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <WalletTransactions />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
