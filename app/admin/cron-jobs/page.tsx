import type { Metadata } from "next";
import { CronJobForm } from "@/components/admin/cron-job-form";
import { CronJobsList } from "@/components/admin/cron-jobs-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export const metadata: Metadata = {
  title: "Cron Job Management",
  description: "Manage scheduled cron jobs for the application",
};

export default function CronJobsPage() {
  return (
    <>
      <DashboardHeader
        heading="Cron Job Management"
        text="Create and manage scheduled tasks for the platform"
      />
      <div className="px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <CronJobForm />
          </div>
          <div className="md:col-span-2">
            <CronJobsList />
          </div>
        </div>
      </div>
    </>
  );
}
