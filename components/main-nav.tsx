"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface MainNavProps {
  className?: string;
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const routes = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
      public: true,
    },
    {
      href: "/how-it-works",
      label: "How It Works",
      active: pathname === "/how-it-works",
      public: true,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname.startsWith("/dashboard"),
      public: false,
    },
    {
      href: "/dashboard/transactions",
      label: "Transactions",
      active: pathname.startsWith("/transactions"),
      public: false,
    },
    {
      href: "/dashboard/wallet",
      label: "Wallet",
      active: pathname.startsWith("/wallet"),
      public: false,
    },
  ];

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {routes.map((route) => {
        if (!route.public && !session) return null;

        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              route.active ? "text-primary" : "text-muted-foreground"
            )}
          >
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
