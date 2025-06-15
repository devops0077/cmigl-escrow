"use client";

import { AdminMessagesCenter } from "@/components/admin/admin-messages-center";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function AdminMessagesPage() {
  return (
    <>
      <DashboardHeader
        heading="Message Center"
        text="Manage conversations with users"
      />
      <div className="container mx-auto py-6 px-6">
        <AdminMessagesCenter />
      </div>
    </>
  );
}
