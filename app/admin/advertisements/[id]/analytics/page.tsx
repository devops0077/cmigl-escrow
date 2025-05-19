import type { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AdvertisementAnalytics } from "@/components/admin/advertisement-analytics";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "Advertisement Analytics",
  description: "View detailed performance metrics for this advertisement",
};

export default async function AdvertisementAnalyticsPage({
  params,
}: PageProps) {
  return (
    <>
      <DashboardHeader
        heading="Advertisement Analytics"
        text="View detailed performance metrics for this advertisement"
      />
      <div className="px-4 md:px-8 py-6">
        <AdvertisementAnalytics id={(await params).id} />
      </div>
    </>
  );
}
