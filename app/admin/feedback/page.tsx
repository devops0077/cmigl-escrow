import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminFeedbackManager from "@/components/admin/admin-feedback-manager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export const metadata: Metadata = {
  title: "Feedback Management | Admin | Vokun Escrow",
  description: "Manage user feedback, suggestions, and bug reports.",
};

export default async function AdminFeedbackPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin/feedback");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get feedback counts by status
  const [pendingCount, reviewedCount, implementedCount, rejectedCount] =
    await Promise.all([
      prisma.platformFeedback.count({ where: { status: "PENDING" } }),
      prisma.platformFeedback.count({ where: { status: "REVIEWED" } }),
      prisma.platformFeedback.count({ where: { status: "IMPLEMENTED" } }),
      prisma.platformFeedback.count({ where: { status: "REJECTED" } }),
    ]);

  return (
    <>
      <DashboardHeader
        heading="Feedback Management"
        text="Review and manage user feedback, suggestions, and bug reports."
      />
      <div className="container py-10 px-4 sm:px-6">
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-background border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{pendingCount}</div>
              <div className="text-muted-foreground">Pending</div>
            </div>
            <div className="bg-background border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{reviewedCount}</div>
              <div className="text-muted-foreground">Reviewed</div>
            </div>
            <div className="bg-background border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{implementedCount}</div>
              <div className="text-muted-foreground">Implemented</div>
            </div>
            <div className="bg-background border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{rejectedCount}</div>
              <div className="text-muted-foreground">Rejected</div>
            </div>
          </div>

          <AdminFeedbackManager />
        </div>
      </div>
    </>
  );
}
