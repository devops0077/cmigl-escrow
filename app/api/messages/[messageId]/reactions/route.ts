import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { triggerNewMessage } from "@/lib/pusher-server";

const addReactionSchema = z.object({
  emoji: z.string().min(1, "Emoji is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messageId = (await params).messageId;
    const body = await request.json();
    const validatedData = addReactionSchema.parse(body);

    // Check if message exists
    const message = await prisma.adminMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: true,
        recipient: true,
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user is part of the conversation
    if (
      message.senderId !== session.user.id &&
      message.recipientId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId: session.user.id,
        emoji: validatedData.emoji,
      },
    });

    if (existingReaction) {
      // Remove reaction if it already exists
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });

      return NextResponse.json({ message: "Reaction removed" });
    }

    // Add new reaction
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId,
        userId: session.user.id,
        emoji: validatedData.emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    // Trigger real-time update
    const otherUserId =
      message.senderId === session.user.id
        ? message.recipientId
        : message.senderId;

    await triggerNewMessage(session.user.id, otherUserId, {
      type: "reaction",
      messageId,
      reaction,
    });

    return NextResponse.json({ reaction });
  } catch (error) {
    console.error("Error adding reaction:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    );
  }
}

