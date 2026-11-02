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
  threadId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "50");
    const threadId = searchParams.get("threadId");
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      OR: [{ senderId: session.user.id }, { recipientId: session.user.id }],
      ...(threadId && { threadId }),
    };

    // Get messages between user and admins
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

    // Mark admin messages as read and trigger read events
    const unreadMessages = await prisma.adminMessage.findMany({
      where: {
        recipientId: session.user.id,
        readAt: null,
        sender: {
          role: "ADMIN",
        },
      },
      select: { id: true, senderId: true },
    });

    if (unreadMessages.length > 0) {
      await prisma.adminMessage.updateMany({
        where: {
          recipientId: session.user.id,
          readAt: null,
          sender: {
            role: "ADMIN",
          },
        },
        data: {
          readAt: new Date(),
        },
      });

      // Trigger read events
      for (const message of unreadMessages) {
        await triggerMessageRead(session.user.id, message.senderId, message.id);
      }
    }

    // Get admin presence status
    const adminPresence = await prisma.userPresence.findMany({
      where: {
        user: {
          role: "ADMIN",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
      },
      adminPresence,
    });
  } catch (error) {
    console.error("Error fetching admin messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Find an admin to send the message to (preferably online admin)
    const admin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
        isActive: true,
      },
      include: {
        presence: true,
      },
      orderBy: {
        presence: {
          isOnline: "desc",
        },
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "No admin available" },
        { status: 404 }
      );
    }

    // Handle threading
    let threadId = validatedData.threadId;
    if (!threadId) {
      // Create new thread for first message
      const thread = await prisma.messageThread.create({
        data: {
          subject: validatedData.content.substring(0, 100),
          participantIds: [session.user.id, admin.id],
        },
      });
      threadId = thread.id;
    }

    // Create the message
    const message = await prisma.adminMessage.create({
      data: {
        senderId: session.user.id,
        recipientId: admin.id,
        content: validatedData.content,
        priority: "NORMAL",
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
    await triggerNewMessage(session.user.id, admin.id, message);

    // Create notification for the admin
    await createNotificationWithPush({
      userId: admin.id,
      title: "New User Message",
      message: `${session.user.name || session.user.email} sent you a message`,
      type: "USER_MESSAGE",
      data: {
        messageId: message.id,
        senderId: session.user.id,
        senderName: session.user.name || session.user.email,
        threadId,
      },
      url: `/admin/users/${session.user.id}?tab=messages`,
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending message to admin:", error);
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

