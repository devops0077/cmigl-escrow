"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchButton } from "@/components/search-button";
import { authClient } from "@/lib/auth-client";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { data: session } = authClient.useSession();

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
      href: "/dashboard/dashboard",
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
    <div className={cn("flex items-center", className)}>
      <SearchButton className="border-0 shadow-none" />
      <ThemeToggle isCollapsed className="w-10 justify-center px-0" />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0 py-4">
          <div className="px-7">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setOpen(false)}
            >
              <span className="font-bold text-primary">CMIGL Escrow</span>
            </Link>
          </div>
          <div className="flex flex-col space-y-3 px-7 pt-10">
            {routes.map((route) => {
              if (!route.public && !session) return null;

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    route.active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {route.label}
                </Link>
              );
            })}
            {!session && (
              <div className="flex flex-col space-y-3 pt-4">
                <Link href="/auth/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setOpen(false)}>
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}


