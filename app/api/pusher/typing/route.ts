import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { triggerUserTyping } from "@/lib/pusher-server";
import { z } from "zod";

const typingSchema = z.object({
  recipientId: z.string(),
  isTyping: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, isTyping } = typingSchema.parse(body);

    // Trigger typing event
    await triggerUserTyping(session.user.id, recipientId, isTyping);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Typing indicator error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to send typing indicator" },
      { status: 500 }
    );
  }
}

