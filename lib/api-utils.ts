import {
  PushNotificationService,
  type PushNotificationPayload,
} from "@/lib/push-notification";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/lib/generated/prisma";

/**
 * Create a notification and send a push notification if enabled
 */
export async function createNotificationWithPush({
  userId,
  title,
  message,
  type = "SYSTEM_NOTIFICATION",
  data = {},
  url,
}: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, any>;
  url?: string;
}) {
  try {
    // Create the notification in the database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data,
      },
    });

    // Check if user has push notifications enabled
    const settings = await PushNotificationService.getUserSettings(userId);

    if (settings.enabled) {
      // Send push notification
      const pushPayload: PushNotificationPayload = {
        title,
        body: message,
        url: url || "/dashboard",
        data: {
          ...data,
          notificationType: type,
        },
      };

      await PushNotificationService.sendToUser(
        userId,
        pushPayload,
        notification.id
      );
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification with push:", error);
    throw error;
  }
}

/**
 * Create a notification for multiple users and send push notifications if enabled
 */
export async function createNotificationForUsers({
  userIds,
  title,
  message,
  type = "SYSTEM_NOTIFICATION",
  data = {},
  url,
}: {
  userIds: string[];
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, any>;
  url?: string;
}) {
  try {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        createNotificationWithPush({
          userId,
          title,
          message,
          type,
          data,
          url,
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error("Error creating notifications for users:", error);
    throw error;
  }
}
