import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  PushNotificationService,
  type NotificationSound,
} from "@/lib/push-notification";
import { prisma } from "@/lib/prisma";

// POST endpoint to send a test push notification
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get sound preference from request or use default
    const { sound = "default" } = await request.json();

    // Send a test notification
    const result = await PushNotificationService.sendToUser(user.id, {
      title: "Test Notification",
      body: "This is a test notification with sound.",
      icon: "/icon1.png",
      url: "/dashboard",
      sound: sound as NotificationSound,
      tag: "test",
    });

    if (!result || result.success === false) {
      return NextResponse.json(
        {
          error:
            "Failed to send test notification. Make sure you're subscribed.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}
