import type React from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { AdvertisementDisplay } from "@/components/advertisements/advertisement-display";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  // Admin role gating lives here, not in middleware: the Edge runtime
  // cannot look the session up, so middleware only checks for a session
  // cookie. Order mirrors the old middleware: non-admins went to
  // /dashboard, and restricted users were sent to /account-restricted.
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  if (session.user.restricted) {
    redirect("/account-restricted");
  }

  return (
    <>
      <AdvertisementDisplay placement="DASHBOARD" />

      <SidebarProvider defaultOpen={true}>
        <div className="w-full flex min-h-screen">
          <DashboardSidebar />
          <main className="w-full flex ">
            <div className="flex-1 w-full">
              <div className=" w-full  space-y-6  pb-24 flex-1 flex-col">
                <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
              </div>
            </div>
          </main>
          <DashboardMobileNav />
        </div>
      </SidebarProvider>
    </>
  );
}

