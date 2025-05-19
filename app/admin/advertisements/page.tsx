import type { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AdvertisementManagement } from "@/components/admin/advertisement-management";
import { getAdminAdvertisements } from "@/lib/advertisement-actions";

export const metadata: Metadata = {
  title: "Advertisement Management",
  description: "Manage advertisements across the platform",
};

export default async function AdvertisementsPage() {
  const advertisements = await getAdminAdvertisements();

  return (
    <>
      <DashboardHeader
        heading="Advertisement Management"
        text="Create and manage advertisements across the platform"
      />
      <div className="px-4 md:px-8 py-6">
        <AdvertisementManagement initialAds={advertisements} />
      </div>
    </>
  );
}
