"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AdminMessageCenter } from "@/components/messages/admin-message-center";
import { EnhancedMessageCenter } from "@/components/messages/enhanced-message-center";
import { RealTimeMessageCenter } from "@/components/messages/real-time-message-center";

export default function UserMessagesPage() {
  return (
    <>
      <DashboardHeader
        heading="Support Messages"
        text="Get real-time help from our support team"
      />
      <div className="container mx-auto py-6 px-6">
        <EnhancedMessageCenter isAdminView={false} />
      </div>
    </>
  );
}
