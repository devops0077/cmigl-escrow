import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminContentManager from "@/components/admin/admin-content-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  title: "Content Management | Admin | CMIGL Escrow",
  description:
    "Manage platform content including knowledge base, tutorials, terms of service, and privacy policy.",
};

export default async function AdminContentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin/content");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get content counts by type
  const [
    knowledgeBaseCount,
    tutorialCount,
    termsCount,
    privacyCount,
    faqCount,
  ] = await Promise.all([
    prisma.contentItem.count({ where: { type: "KNOWLEDGE_BASE" } }),
    prisma.contentItem.count({ where: { type: "TUTORIAL" } }),
    prisma.contentItem.count({ where: { type: "TERMS_OF_SERVICE" } }),
    prisma.contentItem.count({ where: { type: "PRIVACY_POLICY" } }),
    prisma.contentItem.count({ where: { type: "FAQ" } }),
  ]);

  return (
    <>
      <DashboardHeader
        heading="Content Management"
        text="Create, edit, and manage all platform content from a single
            dashboard."
      />
      <div className="container py-10">
        <div className="space-y-3 px-4 sm:px-6">
          <Tabs defaultValue="knowledge-base" className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="knowledge-base">
                Knowledge Base ({knowledgeBaseCount})
              </TabsTrigger>
              <TabsTrigger value="tutorials">
                Tutorials ({tutorialCount})
              </TabsTrigger>
              <TabsTrigger value="terms">
                Terms of Service ({termsCount})
              </TabsTrigger>
              <TabsTrigger value="privacy">
                Privacy Policy ({privacyCount})
              </TabsTrigger>
              <TabsTrigger value="faq">FAQ ({faqCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="knowledge-base">
              <AdminContentManager contentType="KNOWLEDGE_BASE" />
            </TabsContent>

            <TabsContent value="tutorials">
              <AdminContentManager contentType="TUTORIAL" />
            </TabsContent>

            <TabsContent value="terms">
              <AdminContentManager contentType="TERMS_OF_SERVICE" />
            </TabsContent>

            <TabsContent value="privacy">
              <AdminContentManager contentType="PRIVACY_POLICY" />
            </TabsContent>

            <TabsContent value="faq">
              <AdminContentManager contentType="FAQ" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
