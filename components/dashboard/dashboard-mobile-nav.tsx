"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Users,
  Settings,
  Menu,
  HelpCircle,
  LogOut,
  User,
  Shield,
  CreditCard,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { ThemeToggle } from "../theme-toggle";

export function DashboardMobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();

  const isLoadingUserData = status === "loading";
  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";

  const { data: walletData, isLoading: isLoadingWallet } = useWalletBalance();

  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { name: "Transactions", href: "/dashboard/transactions", icon: History },
  ];

  const secondaryNavItems = [
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Help & Support", href: "/support", icon: HelpCircle },
  ];

  const adminNavItems = [
    { name: "Admin Panel", href: "/admin", icon: Shield },
    // { name: "Users", href: "/admin/users", icon: Users },
  ];

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <>
      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-background/90 backdrop-blur-lg border-t border-border px-2 py-2">
          <div className="flex justify-between items-center">
            {mainNavItems.slice(0, 3).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            ))}

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg",
                    isOpen
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Menu className="h-5 w-5" />
                  <span className="text-xs mt-1">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[85vh] rounded-t-3xl bg-background border-border p-0"
              >
                <div className="flex flex-col h-full">
                  {/* Handle for dragging */}
                  <div className="flex justify-center py-4 border-b border-border">
                    <div className="w-12 h-1.5 bg-muted rounded-full"></div>
                  </div>

                  {/* User profile section */}
                  <div className="p-6 border-b border-border">
                    {isLoadingUserData ? (
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 bg-muted">
                          <AvatarFallback className="bg-primary text-primary-foreground" />
                        </Avatar>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted rounded-md"></div>
                          <div className="h-3 w-24 bg-muted rounded-md"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 bg-muted">
                          {user?.image ? (
                            <AvatarImage
                              src={user.image || "/placeholder.svg"}
                              alt={user.name || "User Image"}
                            />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {user?.name?.charAt(0) ||
                                user?.email?.charAt(0) ||
                                "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="space-y-1">
                          <p className="text-lg font-semibold">
                            {user?.name || "User Name"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user?.email || " "}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-muted hover:text-primary"
                        asChild
                      >
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setIsOpen(false)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-muted hover:text-primary"
                        asChild
                      >
                        <Link
                          href="/dashboard/wallet"
                          onClick={() => setIsOpen(false)}
                        >
                          <Wallet className="mr-2 h-4 w-4" />
                          Wallet
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Balance summary */}
                  {isLoadingWallet ? (
                    <div className="p-6 border-b border-border">
                      <div className="bg-muted rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="h-4 w-24 bg-muted-foreground/20 rounded-md"></div>
                          <div className="h-4 w-4 bg-muted-foreground/20 rounded-md"></div>
                        </div>
                        <div className="flex items-baseline">
                          <div className="h-8 w-24 bg-muted-foreground/20 rounded-md"></div>
                          <div className="ml-2 h-4 w-8 bg-muted-foreground/20 rounded-md"></div>
                        </div>
                        <div className="mt-1 h-3 w-20 bg-muted-foreground/20 rounded-md"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border-b border-border">
                      <div className="bg-muted rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm text-muted-foreground">
                            Wallet Balance
                          </h4>
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold">
                            {formatCurrency(walletData?.balance || 0)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(walletData?.escrowAmount || 0)} in
                          escrow
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation links */}
                  <div className="flex-1 overflow-auto py-4 px-6">
                    <nav className="space-y-1">
                      {mainNavItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            "flex items-center py-3 px-3 rounded-lg text-base font-medium transition-colors",
                            pathname === item.href
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted hover:text-primary"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Link>
                      ))}
                    </nav>

                    {isAdmin && (
                      <>
                        <div className="mt-6 pt-6 border-t border-border">
                          <h4 className="text-xs uppercase text-muted-foreground font-medium mb-2 px-3">
                            Admin
                          </h4>
                          <nav className="space-y-1">
                            {adminNavItems.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center py-3 px-3 rounded-lg text-base font-medium text-foreground hover:bg-muted hover:text-primary transition-colors"
                                onClick={() => setIsOpen(false)}
                              >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.name}
                              </Link>
                            ))}
                          </nav>
                        </div>
                      </>
                    )}

                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-xs uppercase text-muted-foreground font-medium mb-2 px-3">
                        Settings
                      </h4>
                      <nav className="space-y-1">
                        {secondaryNavItems.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center py-3 px-3 rounded-lg text-base font-medium text-foreground hover:bg-muted hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </Link>
                        ))}
                        <ThemeToggle isMobile={true} />
                      </nav>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="py-4 px-6 border-t border-border">
                    <Button
                      variant="outline"
                      className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>

                    <div className="flex justify-between items-center mt-4">
                      <p className="text-xs text-muted-foreground">
                        © 2025 CMIGL Escrow
                      </p>
                      <div className="flex space-x-4">
                        <Link
                          href="/terms"
                          className="text-xs text-muted-foreground hover:text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          Terms
                        </Link>
                        <Link
                          href="/privacy"
                          className="text-xs text-muted-foreground hover:text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          Privacy
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </>
  );
}
