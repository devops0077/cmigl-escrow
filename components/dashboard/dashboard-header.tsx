"use client";

import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScroll } from "framer-motion";
import {
  ChevronDown,
  GitBranch,
  LogOut,
  Settings,
  Shield,
  User,
  Wallet,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { NotificationDrawer } from "@/components/notifications/notification-drawer";

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  const [isSticky, setIsSticky] = useState(false);
  const { scrollY } = useScroll();
  const { data, isPending } = authClient.useSession();
  const isLoadingUserData = isPending;
  const router = useRouter();

  // Monitor scroll position to determine if header should be sticky
  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsSticky(latest > 20);
    });
  }, [scrollY]);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <motion.div
      className={`sticky top-0 z-10 w-full pl-4 md:px-4 py-4 transition-all duration-300 ${
        isSticky
          ? "bg-background/80 backdrop-blur-md shadow-md"
          : "bg-transparent"
      }`}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center w-full justify-between">
        <div className="grid w-full gap-1">
          <AnimatePresence>
            <motion.h1
              key="heading"
              className="text-xl md:text-2xl line-clamp-1 font-bold tracking-wide"
              initial={{
                opacity: 1,
                y: 0,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {heading}
            </motion.h1>
            <div className="h-2">
              {text && !isSticky && (
                <motion.p
                  key="subtext"
                  className="text-muted-foreground line-clamp-2 text-xs md:text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {text}
                </motion.p>
              )}
            </div>
          </AnimatePresence>
        </div>

        <div className="flex  items-center gap-2 relative">
          {children}

          <NotificationDrawer />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isLoadingUserData ? (
                <Skeleton
                  className={`flex items-center py-1 w-full gap-2 px-2 `}
                >
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-28 hidden md:block" />
                </Skeleton>
              ) : (
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-accent"
                >
                  <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarImage
                      src={data?.user.image || ""}
                      alt={data?.user.name || "User Image"}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                      {getInitials(data?.user.name || "USER NAME")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block font-medium">
                    {data?.user.name}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {data?.user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {data?.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/wallet")}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Wallet</span>
                </DropdownMenuItem>

                {data?.user.role === "ADMIN" && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  disabled
                  className="relative cursor-not-allowed"
                >
                  <GitBranch className="mr-2 h-4 w-4" />
                  <span>Status</span>
                  <span className="absolute right-2 text-xs text-muted-foreground">
                    {data?.user.status}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                // disableRedirect: without it, Better Auth redirects
                // to the provider's end-session page (a bare "Confirm
                // logout" page, then a "Logged out." page that goes
                // nowhere) whenever the session came from SSO.
                // Standing rule: sign-out always lands on the home page.
                onClick={async () => {
                  await authClient.signOut({ disableRedirect: true });
                  router.push("/");
                  router.refresh();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}


