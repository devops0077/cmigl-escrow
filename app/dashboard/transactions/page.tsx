import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { TransactionsOverview } from "@/components/transactions/transactions-overview";
import { TransactionsSkeleton } from "@/components/skeletons/transactions-skeleton";
import { PageTransition } from "@/components/animations/page-transition";
import { Plus } from "lucide-react";

export default function TransactionsPage() {
  return (
    <PageTransition>
      <DashboardHeader
        heading="Transactions"
        text="Manage and track all your escrow transactions."
      >
        <Button asChild variant="default" className="hidden md:inline-flex">
          <Link href="/dashboard/transactions/new">
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </Link>
        </Button>
      </DashboardHeader>
      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionsOverview />
      </Suspense>
    </PageTransition>
  );
}
