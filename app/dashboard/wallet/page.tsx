import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { WalletOverview } from "@/components/wallet/wallet-overview";
import { WalletSkeleton } from "@/components/skeletons/wallet-skeleton";
import { PageTransition } from "@/components/animations/page-transition";

export default function WalletPage() {
  return (
    <PageTransition>
      <DashboardHeader
        heading="Wallet"
        text="Manage your funds and transaction history."
      />
      <Suspense fallback={<WalletSkeleton />}>
        <WalletOverview />
      </Suspense>
    </PageTransition>
  );
}
