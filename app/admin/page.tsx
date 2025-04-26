"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AdminDashboardOverview } from "@/components/admin/admin-dashboard-overview";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin");
  }

  return (
    <>
      <DashboardHeader
        heading="Admin Dashboard"
        text="Manage users, transactions, and system settings."
      />
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <AdminDashboardOverview />
      </Suspense>
    </>
  );
}
