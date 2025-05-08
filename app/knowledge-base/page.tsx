import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { KnowledgeBaseClient } from "@/components/knowledge-base/knowledge-base-client";

export const metadata: Metadata = {
  title: "Knowledge Base - CMIGL Escrow Services",
  description:
    "Comprehensive guides and articles about using our escrow platform",
};

export default function KnowledgeBasePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <KnowledgeBaseClient />
    </div>
  );
}
