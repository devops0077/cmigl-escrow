import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { pusherServer } from "@/lib/pusher-server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        image: true,
        passportImage: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 404 }
      );
    }

    // Validate channel access
    if (channelName.startsWith("presence-")) {
      // For presence channels, authenticate the user
      const presenceData = {
        user_id: user.id,
        user_info: {
          id: user.id,
          name: user.name || user.username || user.email,
          email: user.email,
          role: user.role,
          image: user.image,
        },
      };

      const authResponse = pusherServer.authorizeChannel(
        socketId,
        channelName,
        presenceData
      );
      return NextResponse.json(authResponse);
    } else if (channelName.startsWith("conversation-")) {
      // For conversation channels, verify user has access to this conversation
      const channelParts = channelName.replace("conversation-", "").split("-");
      if (channelParts.length !== 2) {
        return NextResponse.json(
          { error: "Invalid channel format" },
          { status: 400 }
        );
      }

      const [userId1, userId2] = channelParts;
      if (user.id !== userId1 && user.id !== userId2) {
        return NextResponse.json(
          { error: "Access denied to this conversation" },
          { status: 403 }
        );
      }

      const authResponse = pusherServer.authorizeChannel(socketId, channelName);
      return NextResponse.json(authResponse);
    }

    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

