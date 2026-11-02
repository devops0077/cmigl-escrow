import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { SecurityService } from "@/lib/security-service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active sessions
    const activeSessions = await SecurityService.getUserActiveSessions(
      session.user.id
    );

    return NextResponse.json(activeSessions);
  } catch (error) {
    logger.error("Error fetching active sessions", { error });
    return NextResponse.json(
      { error: "Failed to fetch active sessions" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { sessionId, allExceptCurrent } = body;

    if (allExceptCurrent) {
      // Terminate all sessions except current
      const result = await SecurityService.terminateAllSessions({
        userId: session.user.id,
        currentSessionId: session.session.id || "current_session",
        request,
      });

      return NextResponse.json(result);
    } else if (sessionId) {
      // Terminate specific session
      const result = await SecurityService.terminateSession({
        userId: session.user.id,
        sessionId,
        currentSession: session,
        request,
      });

      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Either sessionId or allExceptCurrent must be provided" },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error("Error terminating session(s)", { error });
    return NextResponse.json(
      { error: "Failed to terminate session(s)" },
      { status: 500 }
    );
  }
}

