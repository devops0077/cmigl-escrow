import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { SecurityService } from "@/lib/security-service";
import { SecurityEventType } from "@/lib/generated/prisma";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");

    // Get filter parameters
    const eventType = searchParams.get("eventType");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const successfulStr = searchParams.get("successful");

    // Parse filter parameters
    const eventTypes = eventType
      ? (eventType
          .split(",")
          .map((type) => type.trim().toUpperCase()) as SecurityEventType[])
      : undefined;

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;
    const successful = successfulStr ? successfulStr === "true" : undefined;

    // Get security logs
    const result = await SecurityService.getUserSecurityLogs({
      userId: session.user.id,
      page,
      limit,
      eventTypes,
      startDate,
      endDate,
      successful,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching security log", { error });
    return NextResponse.json(
      { error: "Failed to fetch security log" },
      { status: 500 }
    );
  }
}

// Schema for validating the POST request body
const securityEventSchema = z.object({
  type: z.nativeEnum(SecurityEventType),
  metadata: z.record(z.any()).optional(),
  successful: z.boolean().optional().default(true),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  deviceInfo: z.string().optional(),
  location: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  email: z.string().optional(),
  // Additional fields for specific event types
  oldEmail: z.string().optional(),
  newEmail: z.string().optional(),
  updatedFields: z.array(z.string()).optional(),
  changedSettings: z.array(z.string()).optional(),
  reason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = securityEventSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      type,
      metadata,
      successful,
      oldEmail,
      newEmail,
      updatedFields,
      changedSettings,
      reason,
      userId,
      email,
    } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Common parameters for all event types
    const commonParams = {
      userId: user.id,
      successful,
      request,
      reason,
    };

    // Handle different event types
    let result;
    switch (type) {
      case SecurityEventType.LOGIN_SUCCESS:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.LOGIN_SUCCESS,
          metadata,
        });
        break;

      case SecurityEventType.LOGIN_FAILED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.LOGIN_FAILED,
          successful: false,
          metadata: { ...metadata, reason: reason || "Unknown reason" },
          request,
        });
        break;

      case SecurityEventType.LOGOUT:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.LOGOUT,
          metadata,
          request,
        });
        break;

      case SecurityEventType.PASSWORD_CHANGED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.PASSWORD_CHANGED,
          metadata,
          request,
        });
        break;

      case SecurityEventType.PASSWORD_RESET_REQUESTED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.PASSWORD_RESET_REQUESTED,
          metadata,
          request,
        });
        break;

      case SecurityEventType.PASSWORD_RESET_COMPLETED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.PASSWORD_RESET_COMPLETED,
          metadata,
          request,
        });
        break;

      case SecurityEventType.EMAIL_CHANGED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.EMAIL_CHANGED,
          metadata: { ...metadata, oldEmail, newEmail },
          request,
        });
        break;

      case SecurityEventType.PROFILE_UPDATED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.PROFILE_UPDATED,
          metadata: { ...metadata, updatedFields },
          request,
        });
        break;

      case SecurityEventType.SETTINGS_CHANGED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.SETTINGS_CHANGED,
          metadata: { ...metadata, changedSettings },
          request,
        });
        break;

      case SecurityEventType.ACCOUNT_DELETION_REQUESTED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.ACCOUNT_DELETION_REQUESTED,
          metadata: { ...metadata, reason },
          request,
        });
        break;

      case SecurityEventType.ACCOUNT_DELETED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.ACCOUNT_DELETED,
          metadata,
          request,
        });
        break;

      case SecurityEventType.SESSION_REVOKED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.SESSION_REVOKED,
          metadata: { ...metadata },
          request,
        });
        break;

      case SecurityEventType.ALL_SESSIONS_REVOKED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.ALL_SESSIONS_REVOKED,
          metadata: { ...metadata },
          request,
        });
        break;

      case SecurityEventType.NEW_DEVICE_DETECTED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.NEW_DEVICE_DETECTED,
          metadata: { ...metadata },
          request,
        });
        break;

      case SecurityEventType.NEW_LOCATION_DETECTED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.NEW_LOCATION_DETECTED,
          metadata: { ...metadata, newLocation: location || "new" },
          request,
        });
        break;

      case SecurityEventType.TWO_FACTOR_ENABLED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.TWO_FACTOR_ENABLED,
          metadata,
          request,
        });
        break;

      case SecurityEventType.TWO_FACTOR_DISABLED:
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: SecurityEventType.TWO_FACTOR_DISABLED,
          metadata,
          request,
        });
        break;

      default:
        // For any other event types, log with the provided type
        result = await SecurityService.logSecurityEvent({
          ...commonParams,
          eventType: type,
          metadata,
          request,
        });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error("Error logging security event", { error });
    return NextResponse.json(
      { error: "Failed to log security event" },
      { status: 500 }
    );
  }
}
