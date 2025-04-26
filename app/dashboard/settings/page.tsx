import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { UserSettings } from "@/components/settings/user-settings";
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton";
import { PageTransition } from "@/components/animations/page-transition";

export default function SettingsPage() {
  return (
    <PageTransition>
      <DashboardHeader
        heading="Settings"
        text="Manage your account settings and preferences."
      />
      <Suspense fallback={<SettingsSkeleton />}>
        <UserSettings />
      </Suspense>
    </PageTransition>
  );
}
