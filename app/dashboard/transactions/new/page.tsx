import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NewTransactionForm } from "@/components/transactions/new-transaction-form";
import { NewTransactionSkeleton } from "@/components/skeletons/new-transaction-skeleton";
import { PageTransition } from "@/components/animations/page-transition";

export default function NewTransactionPage() {
  return (
    <PageTransition>
      <DashboardHeader
        heading="New Transaction"
        text="Create a new escrow transaction with a seller."
      />
      <Suspense fallback={<NewTransactionSkeleton />}>
        <NewTransactionForm />
      </Suspense>
    </PageTransition>
  );
}
