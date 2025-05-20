"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ShoppingCart,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  CreditCard,
  History,
  Shield,
  AlertCircleIcon,
  BookOpen,
  Award,
  Clock,
  PenTool,
  TvMinimalPlayIcon,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/user-avatar";
import { formatCurrency } from "@/lib/utils";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { ScrollArea } from "../ui/scroll-area";
import { ThemeToggle } from "../theme-toggle";
import { UserRole } from "@/lib/generated/prisma";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isAdmin = session?.user?.role === UserRole.ADMIN;

  console.log("isAdmin", isAdmin);
  console.log("session", session?.user?.role);

  const { data: walletData, isLoading: isLoadingWallet } = useWalletBalance();

  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/dashboard/transactions", icon: History },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  ];

  const secondaryNavItems = [
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Help & Support", href: "/help", icon: HelpCircle },
  ];

  const adminNavItems = [
    { name: "Admin Panel", href: "/admin", icon: Shield },
    { name: "Revenue", href: "/admin/revenue", icon: TrendingUp },
    { name: "Disputes", href: "/admin/disputes", icon: AlertCircleIcon },
    { name: "Content", href: "/admin/content", icon: BookOpen },
    { name: "Feedback", href: "/admin/feedback", icon: Users },
  ];

  const adminToolsItems = [
    { name: "Rewards Tool", href: "/admin/rewards", icon: Award },
    { name: "Cron Jobs", href: "/admin/cron-jobs", icon: Clock },
    {
      name: "Ads Tool",
      href: "/admin/advertisements",
      icon: TvMinimalPlayIcon,
    },
    { name: "CEB Tool", href: "/admin/cron-builder", icon: PenTool },
  ];

  return (
    <Sidebar collapsible="icon" className="hidden md:flex border-r">
      <SidebarHeader className="py-4">
        <div className="flex items-center justify-between px-4">
          {state === "expanded" && (
            <>
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-primary">CMIGL</span>
                <span className="ml-1 text-xl font-light">Escrow</span>
              </Link>
              <SidebarTrigger />
            </>
          )}
        </div>
        {state === "collapsed" && <SidebarTrigger className="" />}
        {/* User balance summary */}
        {state === "expanded" && (
          <div
            className={cn(
              "mx-3 mb-4 p-3 rounded-lg bg-muted/70 border border-border transition-all duration-200",
              isCollapsed ? "items-center justify-center" : "border-none"
            )}
          >
            {!isCollapsed ? (
              <>
                {isLoadingWallet ? (
                  <>
                    <div className="flex items-center mb-2">
                      <CreditCard className="h-4 w-4 text-primary/50 mr-2" />
                      <div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-32 bg-muted-foreground/20 rounded animate-pulse mb-2" />
                    <div className="flex items-center">
                      <ShoppingCart className="h-3 w-3 text-green-500/50 mr-1" />
                      <div className="h-3 w-24 bg-muted-foreground/20 rounded animate-pulse" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center mb-2">
                      <CreditCard className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm font-medium">Balance</span>
                    </div>
                    <div className="text-lg font-bold text-primary mb-2">
                      {formatCurrency(walletData?.balance || 0)}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <ShoppingCart className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500 mr-1">
                        {formatCurrency(walletData?.escrowAmount || 0)}
                      </span>
                      <span>in escrow</span>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea>
          <SidebarGroup>
            <SidebarGroupLabel className={cn(isCollapsed && "sr-only")}>
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
                            className={cn(
                              "transition-all duration-200",
                              pathname === item.href &&
                                "bg-primary/10 text-primary font-medium"
                            )}
                          >
                            <Link
                              href={item.href}
                              className="flex items-center"
                            >
                              <item.icon
                                className={cn(
                                  "h-5 w-5",
                                  pathname === item.href
                                    ? "text-primary"
                                    : "text-muted-foreground group-hover:text-primary"
                                )}
                              />
                              {!isCollapsed && (
                                <span className="ml-3">{item.name}</span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">
                            {item.name}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {isAdmin && (
            <>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel className={cn(isCollapsed && "sr-only")}>
                  Admin
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminNavItems.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                className={cn(
                                  "transition-all duration-200",
                                  pathname === item.href &&
                                    "bg-primary/10 text-primary font-medium"
                                )}
                              >
                                <Link
                                  href={item.href}
                                  className="flex items-center"
                                >
                                  <item.icon
                                    className={cn(
                                      "h-5 w-5",
                                      pathname === item.href
                                        ? "text-primary"
                                        : "text-muted-foreground group-hover:text-primary"
                                    )}
                                  />
                                  {!isCollapsed && (
                                    <span className="ml-3">{item.name}</span>
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            {isCollapsed && (
                              <TooltipContent side="right">
                                {item.name}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel className={cn(isCollapsed && "sr-only")}>
                  Admin Tools
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminToolsItems.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                className={cn(
                                  "transition-all duration-200",
                                  pathname === item.href &&
                                    "bg-primary/10 text-primary font-medium"
                                )}
                              >
                                <Link
                                  href={item.href}
                                  className="flex items-center"
                                >
                                  <item.icon
                                    className={cn(
                                      "h-5 w-5",
                                      pathname === item.href
                                        ? "text-primary"
                                        : "text-muted-foreground group-hover:text-primary"
                                    )}
                                  />
                                  {!isCollapsed && (
                                    <span className="ml-3">{item.name}</span>
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            {isCollapsed && (
                              <TooltipContent side="right">
                                {item.name}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel className={cn(isCollapsed && "sr-only")}>
              Support
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {secondaryNavItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
                            className={cn(
                              "transition-all duration-200",
                              pathname === item.href &&
                                "bg-primary/10 text-primary font-medium"
                            )}
                          >
                            <Link
                              href={item.href}
                              className="flex items-center"
                            >
                              <item.icon
                                className={cn(
                                  "h-5 w-5",
                                  pathname === item.href
                                    ? "text-primary"
                                    : "text-muted-foreground group-hover:text-primary"
                                )}
                              />
                              {!isCollapsed && (
                                <span className="ml-3">{item.name}</span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">
                            {item.name}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className={cn("transition-all duration-200")}
                        >
                          <ThemeToggle
                            isMobile={false}
                            isCollapsed={isCollapsed}
                          />
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          Toggle Theme
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="py-4">
        {state === "expanded" && (
          <div className="px-3 mb-2">
            <div className="flex items-center gap-2 p-2">
              <UserAvatar user={session?.user} className="h-8 w-8" />
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {session?.user?.name}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {session?.user?.email}
                </span>
              </div>
            </div>
          </div>
        )}
        <div
          className={cn(
            "px-3 transition-all duration-200",
            isCollapsed ? "items-center justify-center" : ""
          )}
        >
          <Button
            variant="outline"
            className={cn(
              "w-full hover:bg-destructive/10 hover:text-destructive transition-all duration-200",
              isCollapsed && "p-2 flex justify-center"
            )}
            onClick={async () => await signOut()}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
