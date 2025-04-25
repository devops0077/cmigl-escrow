"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AdminTransactions } from "@/components/admin/admin-transactions"
import { AdminUsers } from "@/components/admin/admin-users"
import { AdminFees } from "@/components/admin/admin-fees"
import { getAdminDashboardData } from "@/lib/admin-actions"
import { formatCurrency } from "@/lib/utils"

interface AdminDashboardData {
  totalUsers: number
  totalTransactions: number
  pendingTransactions: number
  totalEscrowFees: number
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const [dashboardData, setDashboardData] = useState<AdminDashboardData>({
    totalUsers: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    totalEscrowFees: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      const fetchData = async () => {
        try {
          const data = await getAdminDashboardData()
          setDashboardData(data)
        } catch (error) {
          console.error("Error fetching admin dashboard data:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchData()
    }
  }, [status, session])

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin")
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Admin Dashboard" text="Manage users, transactions, and system settings." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : dashboardData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : dashboardData.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All-time transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : dashboardData.pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">Transactions awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Escrow Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Loading..." : formatCurrency(dashboardData.totalEscrowFees)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue from escrow fees</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="transactions" className="space-y-4 mt-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="fees">Fee Management</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Manage and approve escrow transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminTransactions />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUsers />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Management</CardTitle>
              <CardDescription>Configure escrow fees for different product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminFees />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
