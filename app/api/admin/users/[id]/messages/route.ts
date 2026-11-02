import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createNotificationWithPush } from "@/lib/api-utils";
import { triggerNewMessage, triggerMessageRead } from "@/lib/pusher-server";

const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content is required")
    .max(1000, "Message too long"),
  attachments: z.array(z.string()).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  threadId: z.string().optional(), // For message threading
});

async function checkAdminPermission() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminPermission();
    const userId = (await params).id;
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "50");
    const threadId = searchParams.get("threadId");
    const offset = (page - 1) * limit;

    // Build where clause for messages
    const whereClause = {
      OR: [
        { senderId: admin.id, recipientId: userId },
        { senderId: userId, recipientId: admin.id },
      ],
      ...(threadId && { threadId }),
    };

    // Get conversation between admin and user
    const messages = await prisma.adminMessage.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            image: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            image: true,
          },
        },
        attachments: true,
        thread: {
          include: {
            messages: {
              take: 3,
              orderBy: { createdAt: "desc" },
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    const totalMessages = await prisma.adminMessage.count({
      where: whereClause,
    });

    // Mark messages from user as read and trigger read events
    const unreadMessages = await prisma.adminMessage.findMany({
      where: {
        senderId: userId,
        recipientId: admin.id,
        readAt: null,
      },
      select: { id: true },
    });

    if (unreadMessages.length > 0) {
      await prisma.adminMessage.updateMany({
        where: {
          senderId: userId,
          recipientId: admin.id,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      // Trigger read events for real-time updates
      for (const message of unreadMessages) {
        await triggerMessageRead(admin.id, userId, message.id);
      }
    }

    // Get user presence
    const userPresence = await prisma.userPresence.findUnique({
      where: { userId },
      select: {
        isOnline: true,
        lastSeen: true,
      },
    });

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
      },
      userPresence,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminPermission();
    const userId = (await params).id;
    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Check if recipient user exists
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, username: true },
    });

    if (!recipient) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle message threading
    let threadId = validatedData.threadId;
    if (!threadId && validatedData.content.includes("Re:")) {
      // Auto-create thread for replies
      const thread = await prisma.messageThread.create({
        data: {
          subject: validatedData.content.substring(0, 100),
          participantIds: [admin.id, userId],
        },
      });
      threadId = thread.id;
    }

    // Create the message
    const message = await prisma.adminMessage.create({
      data: {
        senderId: admin.id,
        recipientId: userId,
        content: validatedData.content,
        priority: validatedData.priority,
        threadId,
        attachments: validatedData.attachments
          ? {
              create: validatedData.attachments.map((url) => ({
                url,
                filename: url.split("/").pop() || "attachment",
                fileType: url.split(".").pop() || "unknown",
              })),
            }
          : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            image: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            image: true,
          },
        },
        attachments: true,
        thread: true,
      },
    });

    // Trigger real-time message event
    await triggerNewMessage(admin.id, userId, message);

    // Create notification for the user
    await createNotificationWithPush({
      userId,
      title: "New Message from Admin",
      message: `You have received a new message from ${admin.name || "Administrator"}`,
      type: "ADMIN_MESSAGE",
      data: {
        messageId: message.id,
        senderId: admin.id,
        senderName: admin.name || "Administrator",
        priority: validatedData.priority,
        threadId,
      },
      url: "/dashboard/messages",
    });

    // Log admin action
    await prisma.securityLog.create({
      data: {
        userId: admin.id,
        eventType: "ADMIN_MESSAGE_SENT",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        successful: true,
        metadata: {
          recipientId: userId,
          recipientEmail: recipient.email,
          messageId: message.id,
          priority: validatedData.priority,
          threadId,
        },
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

