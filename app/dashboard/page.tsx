"use client";

import { Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { PageTransition } from "@/components/animations/page-transition";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
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

