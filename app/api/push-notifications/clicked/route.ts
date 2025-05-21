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

    // Mark the notification as clicked
    await PushNotificationService.markAsClicked(notificationId);

    return NextResponse.json({
      success: true,
      message: "Notification marked as clicked",
    });
  } catch (error) {
    console.error("Error marking notification as clicked:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as clicked" },
      { status: 500 }
    );
  }
}
