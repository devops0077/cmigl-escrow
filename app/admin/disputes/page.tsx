import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminDisputesList } from "@/components/admin/admin-disputes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export const metadata: Metadata = {
  title: "Admin Disputes | Vokun Escrow",
  description: "Manage and resolve user disputes",
};

export default function AdminDisputesPage() {
  return (
    <>
      <DashboardHeader
        heading="Dispute Management"
        text="Review and resolve user disputes for transactions."
      />
      <div className="flex flex-col gap-8 px-4 md:px-8">
        <Card>
          <CardHeader>
            <CardTitle>All Disputes</CardTitle>
            <CardDescription>
              Manage all disputes submitted by users. Click on a dispute to view
              details and resolve it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<DisputesTableSkeleton />}>
              <AdminDisputesList />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DisputesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-[400px] w-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[100px]" />
        <Skeleton className="h-8 w-[200px]" />
      </div>
    </div>
  );
}
