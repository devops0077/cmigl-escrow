import type { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AdvertisementForm } from "@/components/admin/advertisement-form";

export const metadata: Metadata = {
  title: "Create Advertisement",
  description: "Create a new advertisement to display on the platform",
};

export default function NewAdvertisementPage() {
  return (
    <>
      <DashboardHeader
        heading="Create Advertisement"
        text="Create a new advertisement to display on the platform"
      />
      <div className="px-4 md:px-8 py-6">
        <AdvertisementForm />
      </div>
    </>
  );
}
