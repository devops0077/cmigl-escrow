import type React from "react";
interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 w-full p-8 pt-6">{children}</div>
    </div>
  );
}
