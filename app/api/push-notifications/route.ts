import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import {
  PushNotificationService,
  type NotificationSound,
} from "@/lib/push-notification";
import { prisma } from "@/lib/prisma";

// GET endpoint to check subscription status
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's push notification settings
    const settings = await PushNotificationService.getUserSettings(user.id);

    // Get active subscriptions count
    const subscriptionsCount = await prisma.pushSubscription.count({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    return NextResponse.json({
      enabled: settings.enabled,
      subscribed: subscriptionsCount > 0,
      vapidPublicKey: PushNotificationService.getVapidPublicKey(),
      supported: true, // Client will determine actual support
      sound: settings.sound || "default",
    });
  } catch (error) {
    console.error("Error checking push notification status:", error);
    return NextResponse.json(
      { error: "Failed to check push notification status" },
      { status: 500 }
    );
  }
}

// POST endpoint to subscribe to push notifications
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Subscribe the user
    await PushNotificationService.subscribe(user.id, subscription);

    // Ensure push notifications are enabled in user settings
    await PushNotificationService.updateUserSettings(user.id, {
      enabled: true,
    });

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to push notifications",
    });
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return NextResponse.json(
      { error: "Failed to subscribe to push notifications" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to unsubscribe from push notifications
export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required" },
        { status: 400 }
      );
    }

    // Unsubscribe the endpoint
    await PushNotificationService.unsubscribe(endpoint);

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed from push notifications",
    });
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe from push notifications" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update push notification settings
export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { enabled, sound } = await request.json();
    const updateData: { enabled?: boolean; sound?: NotificationSound } = {};

    if (typeof enabled === "boolean") {
      updateData.enabled = enabled;
    }

    if (sound) {
      updateData.sound = sound;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid settings provided" },
        { status: 400 }
      );
    }

    // Update user settings
    await PushNotificationService.updateUserSettings(user.id, updateData);

    return NextResponse.json({
      success: true,
      message: "Push notification settings updated",
    });
  } catch (error) {
    console.error("Error updating push notification settings:", error);
    return NextResponse.json(
      { error: "Failed to update push notification settings" },
      { status: 500 }
    );
  }
}

