import { prisma } from "@/lib/prisma";
import webpush from "web-push";
import { PushNotificationStatus } from "@/lib/generated/prisma";

// Configure web-push with VAPID keys
if (
  !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  !process.env.VAPID_PRIVATE_KEY
) {
  console.warn("VAPID keys are not set. Push notifications will not work.");
}

webpush.setVapidDetails(
  `mailto:${process.env.SUPPORT_EMAIL || "support@cmiglescrow.com"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export type NotificationSound = "default" | "transaction" | "alert" | "none";

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  url?: string;
  sound?: NotificationSound;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class PushNotificationService {
  /**
   * Subscribe a user to push notifications
   */
  static async subscribe(userId: string, subscription: PushSubscriptionJSON) {
    try {
      // Check if subscription already exists
      const existingSubscription = await prisma.pushSubscription.findUnique({
        where: { endpoint: subscription.endpoint },
      });

      if (existingSubscription) {
        // Update existing subscription
        return await prisma.pushSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            lastUsed: new Date(),
            isActive: true,
            expirationTime: subscription.expirationTime
              ? new Date(subscription.expirationTime)
              : null,
          },
        });
      }

      // Create new subscription
      return await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          expirationTime: subscription.expirationTime
            ? new Date(subscription.expirationTime)
            : null,
          userAgent:
            typeof window !== "undefined" ? window.navigator.userAgent : null,
        },
      });
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe a user from push notifications
   */
  static async unsubscribe(endpoint: string) {
    try {
      return await prisma.pushSubscription.update({
        where: { endpoint },
        data: { isActive: false },
      });
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      throw error;
    }
  }

  /**
   * Send a push notification to a specific user
   */
  static async sendToUser(
    userId: string,
    payload: PushNotificationPayload,
    notificationId?: string
  ) {
    try {
      // Get all active subscriptions for the user
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      if (subscriptions.length === 0) {
        console.log(`No active push subscriptions found for user ${userId}`);
        return;
      }

      // Get user settings for notification sound preference
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { notificationSound: true },
      });

      // Use user's sound preference if available, otherwise use the provided sound or default
      const soundPreference =
        userSettings?.notificationSound || payload.sound || "default";

      // Create a push notification record
      const pushNotification = await prisma.pushNotification.create({
        data: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
          image: payload.image,
          tag: payload.tag,
          data: payload.data || {},
          url: payload.url,
          sound: soundPreference !== "none" ? soundPreference : null,
          status: PushNotificationStatus.PENDING,
        },
      });

      // If this is linked to a notification, update the notification
      if (notificationId) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { pushNotificationId: pushNotification.id },
        });
      }

      // Send to all subscriptions
      const results = await Promise.allSettled(
        subscriptions.map(async (subscription) => {
          try {
            const pushSubscription = {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            };

            const pushPayload = JSON.stringify({
              title: payload.title,
              body: payload.body,
              icon: payload.icon || "/icon1.png",
              badge: payload.badge,
              image: payload.image,
              tag: payload.tag,
              data: {
                ...payload.data,
                url: payload.url || "/dashboard",
                notificationId: pushNotification.id,
                sound: soundPreference !== "none" ? soundPreference : null,
              },
              actions: payload.actions,
            });

            const result = await webpush.sendNotification(
              pushSubscription,
              pushPayload,
              {
                TTL: 60 * 60, // 1 hour in seconds
              }
            );

            // Update subscription last used time
            await prisma.pushSubscription.update({
              where: { id: subscription.id },
              data: { lastUsed: new Date() },
            });

            return result;
          } catch (error: any) {
            console.error(
              `Error sending push notification to subscription ${subscription.id}:`,
              error
            );

            // Handle expired or invalid subscriptions
            if (error.statusCode === 404 || error.statusCode === 410) {
              await prisma.pushSubscription.update({
                where: { id: subscription.id },
                data: { isActive: false },
              });
            }

            throw error;
          }
        })
      );

      // Check results and update push notification status
      const allFailed = results.every((result) => result.status === "rejected");
      const allSucceeded = results.every(
        (result) => result.status === "fulfilled"
      );

      await prisma.pushNotification.update({
        where: { id: pushNotification.id },
        data: {
          status: allFailed
            ? PushNotificationStatus.FAILED
            : allSucceeded
              ? PushNotificationStatus.SENT
              : PushNotificationStatus.SENT,
          sentAt: new Date(),
          errorMessage: allFailed
            ? "Failed to send to all subscriptions"
            : null,
        },
      });

      return {
        success: !allFailed,
        pushNotificationId: pushNotification.id,
        results,
      };
    } catch (error) {
      console.error("Error sending push notification:", error);
      throw error;
    }
  }

  /**
   * Send a push notification to multiple users
   */
  static async sendToUsers(
    userIds: string[],
    payload: PushNotificationPayload
  ) {
    try {
      const results = await Promise.allSettled(
        userIds.map((userId) => this.sendToUser(userId, payload))
      );

      return results;
    } catch (error) {
      console.error(
        "Error sending push notifications to multiple users:",
        error
      );
      throw error;
    }
  }

  /**
   * Mark a push notification as delivered
   */
  static async markAsDelivered(pushNotificationId: string) {
    try {
      return await prisma.pushNotification.update({
        where: { id: pushNotificationId },
        data: {
          status: PushNotificationStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error marking push notification as delivered:", error);
      throw error;
    }
  }

  /**
   * Mark a push notification as clicked
   */
  static async markAsClicked(pushNotificationId: string) {
    try {
      return await prisma.pushNotification.update({
        where: { id: pushNotificationId },
        data: {
          status: PushNotificationStatus.CLICKED,
          clickedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error marking push notification as clicked:", error);
      throw error;
    }
  }

  /**
   * Get push notification settings for a user
   */
  static async getUserSettings(userId: string) {
    try {
      const settings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      return {
        enabled: settings?.pushNotifications ?? true,
        sound: settings?.notificationSound || "default",
      };
    } catch (error) {
      console.error("Error getting push notification settings:", error);
      throw error;
    }
  }

  /**
   * Update push notification settings for a user
   */
  static async updateUserSettings(
    userId: string,
    settings: { enabled?: boolean; sound?: NotificationSound }
  ) {
    try {
      const { enabled, sound } = settings;
      const updateData: any = {};

      if (typeof enabled === "boolean") {
        updateData.pushNotifications = enabled;
      }

      if (sound) {
        updateData.notificationSound = sound;
      }

      return await prisma.userSettings.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          pushNotifications: enabled ?? true,
          notificationSound: sound || "default",
        },
      });
    } catch (error) {
      console.error("Error updating push notification settings:", error);
      throw error;
    }
  }

  /**
   * Get VAPID public key
   */
  static getVapidPublicKey() {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  }

  /**
   * Check if push notifications are supported
   */
  static isSupported() {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    );
  }

  /**
   * Get available notification sounds
   */
  static getAvailableSounds() {
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
  }

  /**
   * Play a notification sound
   */
  static playSound(sound: NotificationSound = "default") {
    if (typeof window === "undefined" || sound === "none") return;

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
  }
}
