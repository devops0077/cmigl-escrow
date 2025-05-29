"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { PageTransition } from "@/components/animations/page-transition";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <PageTransition>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome back! Here's an overview of your escrow activities."
      />
      <DashboardOverview />
    </PageTransition>
  );
}
