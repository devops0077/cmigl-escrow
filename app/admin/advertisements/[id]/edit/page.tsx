import type { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AdvertisementForm } from "@/components/admin/advertisement-form";

interface PageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: "Edit Advertisement",
  description: "Update an existing advertisement",
};

export default function EditAdvertisementPage({ params }: PageProps) {
  return (
    <>
      <DashboardHeader
        heading="Edit Advertisement"
        text="Update an existing advertisement"
      />
      <div className="px-4 md:px-8 py-6">
        <AdvertisementForm id={params.id} isEditing />
      </div>
    </>
  );
}
