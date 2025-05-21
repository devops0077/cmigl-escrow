"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, RefreshCw, Trash2, Wrench } from "lucide-react";
import {
  clearServiceWorkerCaches,
  unregisterServiceWorkers,
} from "@/lib/register-service-worker";
import { toast } from "sonner";

export function DevTools() {
  const [isLoading, setIsLoading] = useState<{
    clearCache: boolean;
    unregisterSW: boolean;
    testNotification: boolean;
  }>({
    clearCache: false,
    unregisterSW: false,
    testNotification: false,
  });

  const handleClearCache = async () => {
    setIsLoading((prev) => ({ ...prev, clearCache: true }));
    try {
      // Clear browser cache
      const success = await clearServiceWorkerCaches();

      if (success) {
        toast.success("Cache cleared", {
          description: "Service worker caches have been cleared successfully.",
        });
      } else {
        toast.error("Cache clearing failed", {
          description: "Failed to clear service worker caches.",
        });
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast.error("Error", {
        description: "An error occurred while clearing the cache.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, clearCache: false }));
    }
  };

  const handleUnregisterServiceWorkers = async () => {
    setIsLoading((prev) => ({ ...prev, unregisterSW: true }));
    try {
      const success = await unregisterServiceWorkers();

      if (success) {
        toast.success("Service workers unregistered", {
          description:
            "All service workers have been unregistered. Refresh the page to see changes.",
        });
      } else {
        toast.error("Unregistration failed", {
          description: "Failed to unregister service workers.",
        });
      }
    } catch (error) {
      console.error("Error unregistering service workers:", error);
      toast.error("Error", {
        description: "An error occurred while unregistering service workers.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, unregisterSW: false }));
    }
  };

  const handleTestNotification = async () => {
    setIsLoading((prev) => ({ ...prev, testNotification: true }));
    try {
      const response = await fetch("/api/push-notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Notification",
          body: "This is a test notification from the dev tools.",
          sound: "alert",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Test notification sent", {
          description: data.message || "A test notification has been sent.",
        });
      } else {
        toast.error("Failed to send test notification", {
          description:
            data.error ||
            "An error occurred while sending the test notification.",
        });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Error", {
        description: "An error occurred while sending the test notification.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, testNotification: false }));
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Developer Tools
        </CardTitle>
        <CardDescription>
          Tools to help with development and debugging
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="service-worker">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="service-worker">Service Worker</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="service-worker" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Service Worker Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage service worker caches and registrations during
                development.
              </p>

              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="mt-1">
                    <RefreshCw className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium">Clear Service Worker Caches</h4>
                    <p className="text-sm text-muted-foreground">
                      Clear all caches created by the service worker. This is
                      useful when testing offline functionality or when cached
                      content is causing issues.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleClearCache}
                      disabled={isLoading.clearCache}
                      className="mt-2"
                    >
                      {isLoading.clearCache ? "Clearing..." : "Clear Caches"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="mt-1">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium">Unregister Service Workers</h4>
                    <p className="text-sm text-muted-foreground">
                      Unregister all service workers. Use this when you want to
                      completely remove service worker functionality or when
                      troubleshooting service worker issues.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="destructive"
                        onClick={handleUnregisterServiceWorkers}
                        disabled={isLoading.unregisterSW}
                      >
                        {isLoading.unregisterSW
                          ? "Unregistering..."
                          : "Unregister All Service Workers"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Notification Testing</h3>
              <p className="text-sm text-muted-foreground">
                Test push notifications and notification sounds.
              </p>

              <div className="flex items-start gap-4 p-4 border rounded-lg mt-4">
                <div className="mt-1">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium">Send Test Notification</h4>
                  <p className="text-sm text-muted-foreground">
                    Send a test push notification to your current device. This
                    will help verify that push notifications are working
                    correctly.
                  </p>
                  <Button
                    variant="default"
                    onClick={handleTestNotification}
                    disabled={isLoading.testNotification}
                    className="mt-2"
                  >
                    {isLoading.testNotification
                      ? "Sending..."
                      : "Send Test Notification"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          These tools are only intended for development use.
        </p>
      </CardFooter>
    </Card>
  );
}
