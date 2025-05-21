"use client";

import { DevTools } from "@/components/dev/dev-tools";

export default function DevToolsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Developer Tools</h1>
      <DevTools />
    </div>
  );
}
