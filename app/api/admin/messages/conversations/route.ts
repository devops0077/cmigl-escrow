import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";

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

export async function GET(request: Request) {
  try {
    const admin = await checkAdminPermission();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build search conditions
    const searchConditions = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { username: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Get users who have exchanged messages with the admin
    const usersWithMessages = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              // Users who sent messages to this admin
              {
                sentMessages: {
                  some: {
                    recipientId: admin.id,
                  },
                },
              },
              // Users who received messages from this admin
              {
                id: {
                  in: await prisma.adminMessage
                    .findMany({
                      where: { senderId: admin.id },
                      select: { recipientId: true },
                      distinct: ["recipientId"],
                    })
                    .then((messages) =>
                      messages
                        .map((msg) => msg.recipientId)
                        .filter((id): id is string => id !== null)
                    ),
                },
              },
            ],
          },
          searchConditions,
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        role: true,
        restricted: true,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    // Get conversation details for each user
    const conversations = await Promise.all(
      usersWithMessages.map(async (user) => {
        // Get the last message in the conversation
        const lastMessage = await prisma.adminMessage.findFirst({
          where: {
            OR: [
              { senderId: user.id, recipientId: admin.id },
              { senderId: admin.id, recipientId: user.id },
            ],
          },
          orderBy: { createdAt: "desc" },
          select: {
            content: true,
            createdAt: true,
          },
        });

        // Count unread messages from this user to the admin
        const unreadCount = await prisma.adminMessage.count({
          where: {
            senderId: user.id,
            recipientId: admin.id,
            readAt: null,
          },
        });

        return {
          ...user,
          lastMessage: lastMessage?.content || null,
          lastMessageAt: lastMessage?.createdAt || null,
          unreadCount,
        };
      })
    );

    // Sort conversations by last message timestamp (most recent first)
    const sortedConversations = conversations.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return (
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
      );
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: {
        AND: [
          {
            OR: [
              {
                sentMessages: {
                  some: {
                    recipientId: admin.id,
                  },
                },
              },
              {
                id: {
                  in: await prisma.adminMessage
                    .findMany({
                      where: { senderId: admin.id },
                      select: { recipientId: true },
                      distinct: ["recipientId"],
                    })
                    .then((messages) =>
                      messages
                        .map((msg) => msg.recipientId)
                        .filter((id): id is string => id !== null)
                    ),
                },
              },
            ],
          },
          searchConditions,
        ],
      },
    });

    return NextResponse.json({
      conversations: sortedConversations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

