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

    // Get all conversations (users who have exchanged messages with admins)
    const conversations = (await prisma.$queryRaw`
      SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        u.username,
        u.image,
        u.role,
        u.restricted,
        u.isActive,
        (
          SELECT content 
          FROM AdminMessage am 
          WHERE (am.senderId = u.id AND am.recipientId = ${admin.id}) 
             OR (am.senderId = ${admin.id} AND am.recipientId = u.id)
          ORDER BY am.createdAt DESC 
          LIMIT 1
        ) as lastMessage,
        (
          SELECT createdAt 
          FROM AdminMessage am 
          WHERE (am.senderId = u.id AND am.recipientId = ${admin.id}) 
             OR (am.senderId = ${admin.id} AND am.recipientId = u.id)
          ORDER BY am.createdAt DESC 
          LIMIT 1
        ) as lastMessageAt,
        (
          SELECT COUNT(*) 
          FROM AdminMessage am 
          WHERE am.senderId = u.id 
            AND am.recipientId = ${admin.id} 
            AND am.readAt IS NULL
        ) as unreadCount
      FROM User u
      WHERE EXISTS (
        SELECT 1 FROM AdminMessage am 
        WHERE (am.senderId = u.id AND am.recipientId = ${admin.id}) 
           OR (am.senderId = ${admin.id} AND am.recipientId = u.id)
      )
      ${search ? `AND (u.name ILIKE '%${search}%' OR u.email ILIKE '%${search}%' OR u.username ILIKE '%${search}%')` : ""}
      ORDER BY lastMessageAt DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as any[];

    const totalConversations = (await prisma.$queryRaw`
      SELECT COUNT(DISTINCT u.id) as count
      FROM User u
      WHERE EXISTS (
        SELECT 1 FROM AdminMessage am 
        WHERE (am.senderId = u.id AND am.recipientId = ${admin.id}) 
           OR (am.senderId = ${admin.id} AND am.recipientId = u.id)
      )
      ${search ? `AND (u.name ILIKE '%${search}%' OR u.email ILIKE '%${search}%' OR u.username ILIKE '%${search}%')` : ""}
    `) as any[];

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total: Number(totalConversations[0]?.count || 0),
        totalPages: Math.ceil(
          Number(totalConversations[0]?.count || 0) / limit
        ),
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

