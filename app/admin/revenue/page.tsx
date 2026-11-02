"use client";

import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminRevenueManagement } from "@/components/admin/admin-revenue-management";

export default function AdminRevenuePage() {
  return (
    <>
      <DashboardHeader
        heading="Revenue Management"
        text="View and manage all platform revenue from escrow fees and registration fees."
      />
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <AdminRevenueManagement />
      </Suspense>
    </>
  );
}

