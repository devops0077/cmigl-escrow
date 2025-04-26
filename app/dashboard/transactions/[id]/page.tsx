import { Suspense } from "react";
import { TransactionDetails } from "@/components/transactions/transaction-details";
import { TransactionDetailSkeleton } from "@/components/skeletons/transaction-detail-skeleton";
import { PageTransition } from "@/components/animations/page-transition";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Suspense fallback={<TransactionDetailSkeleton />}>
        <TransactionDetails id={id} />
      </Suspense>
    </>
  );
}
