"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { formatCurrency } from "@/lib/utils";
import { getUserDashboardData } from "@/lib/data-actions";
import { FadeIn } from "@/components/animations/fade-in";

interface DashboardData {
  walletBalance: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalTransactions: number;
}

export function DashboardOverview() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    walletBalance: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    totalTransactions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getUserDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <FadeIn>
      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4 w-full">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Wallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading
                    ? "Loading..."
                    : formatCurrency(dashboardData.walletBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available for transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "Loading..." : dashboardData.pendingTransactions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting completion
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading
                    ? "Loading..."
                    : dashboardData.completedTransactions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "Loading..." : dashboardData.totalTransactions}
                </div>
                <p className="text-xs text-muted-foreground">
                  All-time transactions
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 w-full">
              <CardHeader>
                <CardTitle>Transaction Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-3 w-full">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Your most recent escrow activities
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                <RecentTransactions />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                A complete history of your escrow transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTransactions showAll />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </FadeIn>
  );
}
