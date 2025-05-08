import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { TutorialsClient } from "@/components/tutorials/tutorials-client";

export const metadata: Metadata = {
  title: "Tutorials - CMIGL Escrow Services",
  description:
    "Step-by-step guides and video tutorials for using our escrow platform",
};

export default function TutorialsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <TutorialsClient />
    </div>
  );
}
