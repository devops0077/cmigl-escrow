import type React from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  return (
    <SidebarProvider className="p-0" defaultOpen={true}>
      <div className="w-full flex min-h-screen">
        <DashboardSidebar />
        <main className="w-full flex ">
          <div className="flex-1 w-full">
            <div className=" w-full  space-y-6 pb-24 flex-1 flex-col">
              <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
            </div>
          </div>
        </main>
        <DashboardMobileNav />
      </div>
    </SidebarProvider>
  );
}
