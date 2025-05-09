import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import FeedbackForm from "@/components/feedback/feedback-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Feedback | CMIGL Escrow",
  description:
    "Submit your feedback, suggestions, or bug reports to help us improve our platform.",
};

export default async function FeedbackPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/feedback");
  }

  return (
    <>
      <SiteHeader />

      <div className="container mx-auto max-w-4xl py-10">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
            <p className="text-muted-foreground mt-2">
              We value your input! Share your thoughts, report issues, or
              suggest improvements to help us enhance your experience.
            </p>
          </div>

          <FeedbackForm />
        </div>
      </div>
    </>
  );
}
