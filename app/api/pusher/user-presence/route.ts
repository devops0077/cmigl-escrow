import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { triggerUserPresence } from "@/lib/pusher-server";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isOnline } = await request.json();

    // Update user's last seen timestamp
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        updatedAt: new Date(),
      },
    });

    // Create or update user presence record
    await prisma.userPresence.upsert({
      where: { userId: session.user.id },
      update: {
        isOnline,
        lastSeen: new Date(),
      },
      create: {
        userId: session.user.id,
        isOnline,
        lastSeen: new Date(),
      },
    });

    // Trigger presence event
    await triggerUserPresence(session.user.id, isOnline);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User presence update error:", error);
    return NextResponse.json(
      { error: "Failed to update presence" },
      { status: 500 }
    );
  }
}

