import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { oldEndpoint, newSubscription } = await request.json();

    if (!oldEndpoint || !newSubscription || !newSubscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Find the old subscription
    const oldSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint: oldEndpoint },
    });

    if (!oldSubscription) {
      return NextResponse.json(
        { error: "Original subscription not found" },
        { status: 404 }
      );
    }

    // Update with new subscription details
    await prisma.pushSubscription.update({
      where: { id: oldSubscription.id },
      data: {
        endpoint: newSubscription.endpoint,
        p256dh: newSubscription.keys.p256dh,
        auth: newSubscription.keys.auth,
        lastUsed: new Date(),
        expirationTime: newSubscription.expirationTime
          ? new Date(newSubscription.expirationTime)
          : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
    });
  } catch (error) {
    console.error("Error updating push subscription:", error);
    return NextResponse.json(
      { error: "Failed to update push subscription" },
      { status: 500 }
    );
  }
}
