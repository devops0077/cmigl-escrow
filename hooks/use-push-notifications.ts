"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { NotificationSound } from "@/lib/push-notification";

interface PushNotificationStatus {
  enabled: boolean;
  subscribed: boolean;
  vapidPublicKey: string;
  supported: boolean;
  sound: NotificationSound;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentSound, setCurrentSound] =
    useState<NotificationSound>("default");
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const queryClient = useQueryClient();

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (supported) {
        try {
          // Register service worker
          const reg =
            await navigator.serviceWorker.register("/service-worker.js");
          setRegistration(reg);

          // Check if already subscribed
          const subscription = await reg.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error("Error registering service worker:", error);
          setIsSupported(false);
        }
      }
    };

    checkSupport();

    // Set up listener for sound playing messages from service worker
    if (typeof window !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "PLAY_NOTIFICATION_SOUND") {
          const audio = new Audio(event.data.sound);
          audio.volume = 0.5;
          audio.play().catch((error) => {
            console.error("Error playing notification sound:", error);
          });
        }
      });
    }
  }, []);

  // Fetch push notification status
  const { data: statusData, isLoading: isStatusLoading } = useQuery({
    queryKey: ["pushNotificationStatus"],
    queryFn: async (): Promise<PushNotificationStatus> => {
      try {
        const response = await fetch("/api/push-notifications");
        if (!response.ok)
          throw new Error("Failed to fetch push notification status");
        return await response.json();
      } catch (error) {
        console.error("Error fetching push notification status:", error);
        return {
          enabled: false,
          subscribed: false,
          vapidPublicKey: "",
          supported: false,
          sound: "default",
        };
      }
    },
    enabled: isSupported,
  });

  // Update state based on fetched status
  useEffect(() => {
    if (statusData) {
      setIsEnabled(statusData.enabled);
      setCurrentSound(statusData.sound || "default");
    }
  }, [statusData]);

  // Subscribe to push notifications
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration) throw new Error("Service worker not registered");

      try {
        // Convert base64 string to Uint8Array
        const vapidPublicKey = statusData?.vapidPublicKey;
        if (!vapidPublicKey) throw new Error("VAPID public key not available");

        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        // Send subscription to server
        const response = await fetch("/api/push-notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subscription }),
        });

        if (!response.ok)
          throw new Error("Failed to subscribe to push notifications");

        return await response.json();
      } catch (error) {
        console.error("Error subscribing to push notifications:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setIsSubscribed(true);
      queryClient.invalidateQueries({ queryKey: ["pushNotificationStatus"] });
      toast.success("Successfully subscribed to push notifications");
    },
    onError: (error) => {
      console.error("Error subscribing to push notifications:", error);
      toast.error("Failed to subscribe to push notifications");
    },
  });

  // Unsubscribe from push notifications
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration) throw new Error("Service worker not registered");

      try {
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) throw new Error("No subscription found");

        // Unsubscribe locally
        await subscription.unsubscribe();

        // Send unsubscribe request to server
        const response = await fetch("/api/push-notifications", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        if (!response.ok)
          throw new Error("Failed to unsubscribe from push notifications");

        return await response.json();
      } catch (error) {
        console.error("Error unsubscribing from push notifications:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setIsSubscribed(false);
      queryClient.invalidateQueries({ queryKey: ["pushNotificationStatus"] });
      toast.success("Successfully unsubscribed from push notifications");
    },
    onError: (error) => {
      console.error("Error unsubscribing from push notifications:", error);
      toast.error("Failed to unsubscribe from push notifications");
    },
  });

  // Update push notification settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: {
      enabled?: boolean;
      sound?: NotificationSound;
    }) => {
      try {
        const response = await fetch("/api/push-notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        });

        if (!response.ok)
          throw new Error("Failed to update push notification settings");

        return await response.json();
      } catch (error) {
        console.error("Error updating push notification settings:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      if (variables.enabled !== undefined) {
        setIsEnabled(variables.enabled);
      }
      if (variables.sound !== undefined) {
        setCurrentSound(variables.sound);
      }
      queryClient.invalidateQueries({ queryKey: ["pushNotificationStatus"] });
      toast.success("Push notification settings updated");
    },
    onError: (error) => {
      console.error("Error updating push notification settings:", error);
      toast.error("Failed to update push notification settings");
    },
  });

  // Toggle subscription
  const toggleSubscription = useCallback(async () => {
    if (isSubscribed) {
      unsubscribeMutation.mutate();
    } else {
      subscribeMutation.mutate();
    }
  }, [isSubscribed, subscribeMutation, unsubscribeMutation]);

  // Update settings
  const updateSettings = useCallback(
    (enabled: boolean) => {
      return updateSettingsMutation.mutateAsync({ enabled });
    },
    [updateSettingsMutation]
  );

  // Update sound preference
  const updateSound = useCallback(
    (sound: NotificationSound) => {
      return updateSettingsMutation.mutateAsync({ sound });
    },
    [updateSettingsMutation]
  );

  // Play a test sound
  const playTestSound = useCallback((sound: NotificationSound = "default") => {
    if (sound === "none") return;

    const soundMap = {
      default: "/sounds/notification.mp3",
      transaction: "/sounds/transaction.mp3",
      alert: "/sounds/alert.mp3",
    };

    const soundPath = soundMap[sound] || soundMap.default;
    const audio = new Audio(soundPath);
    audio.volume = 0.5;
    audio.play().catch((error) => {
      console.error("Error playing notification sound:", error);
    });
  }, []);

  // Get available sounds
  const getAvailableSounds = useCallback(() => {
    return [
      { id: "default", name: "Default", path: "/sounds/notification.mp3" },
      {
        id: "transaction",
        name: "Transaction",
        path: "/sounds/transaction.mp3",
      },
      { id: "alert", name: "Alert", path: "/sounds/alert.mp3" },
      { id: "none", name: "None", path: "" },
    ];
  }, []);

  return {
    isSupported,
    isSubscribed,
    isEnabled,
    currentSound,
    isLoading:
      isStatusLoading ||
      subscribeMutation.isPending ||
      unsubscribeMutation.isPending,
    toggleSubscription,
    updateSettings,
    updateSound,
    playTestSound,
    getAvailableSounds,
  };
}

// Helper function to convert base64 to Uint8Array
// (Required for the applicationServerKey)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
