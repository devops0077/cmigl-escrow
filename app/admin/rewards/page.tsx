"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RewardProgramsList } from "@/components/admin/reward-programs-list";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRewardsPage() {
  return (
    <>
      <DashboardHeader
        heading="Reward Management"
        text="Create and manage reward programs for your users."
      />
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <RewardProgramsList />
      </Suspense>
    </>
  );
}
