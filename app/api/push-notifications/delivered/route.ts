import { NextResponse } from "next/server";
import { PushNotificationService } from "@/lib/push-notification";

export async function POST(request: Request) {
  try {
    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Mark the notification as delivered
    await PushNotificationService.markAsDelivered(notificationId);

    return NextResponse.json({
      success: true,
      message: "Notification marked as delivered",
    });
  } catch (error) {
    console.error("Error marking notification as delivered:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as delivered" },
      { status: 500 }
    );
  }
}
