"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, ChevronRight, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationsAsRead,
  useMarkAllNotificationsAsRead,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { NotificationType } from "@/lib/generated/prisma";

interface NotificationDrawerProps {
  className?: string;
}

export function NotificationDrawer({ className }: NotificationDrawerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);

  const { data: unreadCountData } = useUnreadNotificationsCount();
  const unreadCount = unreadCountData?.meta?.unreadCount || 0;

  const { data: notificationsData, isLoading } = useNotifications(
    page,
    10,
    activeTab === "unread"
  );

  const markAsRead = useMarkNotificationsAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate({ ids: [id] });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "TRANSACTION_CREATED":
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        );
      case "TRANSACTION_STATUS_CHANGED":
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
        );
      case "WALLET_UPDATED":
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        );
      case "SYSTEM_NOTIFICATION":
        return (
          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
          </div>
        </SheetHeader>

        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            setPage(1);
          }}
          className="flex-1 flex flex-col "
        >
          <div className="border-b px-4 pb-4 flex items-center justify-between">
            <TabsList className="flex-1 space-x-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread" disabled={unreadCount === 0}>
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className=" h-[440px]">
            <div className="flex-1 overflow-auto">
              <TabsContent value="all" className="m-0 p-0 h-full">
                <div className="divide-y">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3 p-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : notificationsData?.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                      <p className="text-muted-foreground">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      <ScrollArea>
                        {notificationsData?.data.map((notification) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors",
                              !notification.read && "bg-muted/30"
                            )}
                          >
                            {getNotificationIcon(
                              notification.type as NotificationType
                            )}
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-sm",
                                  !notification.read && "font-medium"
                                )}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(
                                  new Date(notification.createdAt),
                                  { addSuffix: true }
                                )}
                              </p>
                            </div>
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                              >
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Mark as read</span>
                              </Button>
                            )}
                          </motion.div>
                        ))}
                      </ScrollArea>
                    </AnimatePresence>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="unread" className="m-0 p-0 h-full">
                <div className="divide-y">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3 p-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : notificationsData?.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <CheckCheck className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                      <p className="text-muted-foreground">
                        No unread notifications
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {notificationsData?.data.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors bg-muted/30"
                        >
                          {getNotificationIcon(
                            notification.type as NotificationType
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <SheetFooter className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
