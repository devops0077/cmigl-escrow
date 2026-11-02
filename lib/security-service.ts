import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/error-class";
import { SecurityEventType } from "@/lib/generated/prisma";
import { getClientIp } from "request-ip";
import { UAParser } from "ua-parser-js";
import type { NextRequest } from "next/server";
import type { AuthSession } from "@/auth";

/**
 * Service class for handling security-related operations
 */
export class SecurityService {
  /**
   * Log a security event
   */
  static async logSecurityEvent({
    userId,
    eventType,
    ipAddress,
    userAgent,
    deviceInfo,
    location,
    metadata,
    successful = true,
    sessionId,
    request,
  }: {
    userId: string;
    eventType: SecurityEventType;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: string;
    location?: string;
    metadata?: Record<string, any>;
    successful?: boolean;
    sessionId?: string;
    next_request?: NextRequest;
    request?: Request;
  }) {
    try {
      // Extract IP and user agent from request if provided
      if (request) {
        if (!ipAddress) {
          ipAddress = getClientIp(request as any) || undefined;
        }

        if (!userAgent) {
          userAgent = request.headers.get("user-agent") || undefined;
        }

        if (!deviceInfo && userAgent) {
          const parser = new UAParser(userAgent);
          const result = parser.getResult();
          deviceInfo = JSON.stringify({
            browser: `${result.browser.name} ${result.browser.version}`,
            os: `${result.os.name} ${result.os.version}`,
            device: result.device.type || "desktop",
          });
        }
      }

      // Create security log entry
      const securityLog = await prisma.securityLog.create({
        data: {
          userId,
          eventType,
          ipAddress,
          userAgent,
          deviceInfo,
          location,
          metadata: metadata ? metadata : undefined,
          successful,
          sessionId,
        },
      });

      return securityLog;
    } catch (error) {
      logger.error("Error logging security event", {
        userId,
        eventType,
        error,
      });
      // Don't throw the error - logging should not interrupt the main flow
      return null;
    }
  }

  /**
   * Get security logs for a user
   */
  static async getUserSecurityLogs({
    userId,
    page = 1,
    limit = 10,
    eventTypes,
    startDate,
    endDate,
    successful,
  }: {
    userId: string;
    page?: number;
    limit?: number;
    eventTypes?: SecurityEventType[];
    startDate?: Date;
    endDate?: Date;
    successful?: boolean;
  }) {
    try {
      // Build filter conditions
      const where: any = { userId };

      if (eventTypes && eventTypes.length > 0) {
        where.eventType = { in: eventTypes };
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      if (successful !== undefined) {
        where.successful = successful;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await prisma.securityLog.count({ where });

      // Get paginated logs
      const logs = await prisma.securityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });

      return {
        data: logs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error getting user security logs", { userId, error });
      throw new AppError("Failed to fetch security logs", 500);
    }
  }

  /**
   * Get active sessions for a user
   */
  static async getUserActiveSessions(userId: string) {
    try {
      // In a real application, you would fetch this from your database
      // For this example, we'll return mock data
      const mockSessions = [
        {
          id: "session_1",
          userAgent: "Chrome on Windows",
          ipAddress: "192.168.1.1",
          lastActive: new Date(),
          isCurrent: true,
        },
        {
          id: "session_2",
          userAgent: "Safari on macOS",
          ipAddress: "192.168.1.2",
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isCurrent: false,
        },
        {
          id: "session_3",
          userAgent: "Firefox on Linux",
          ipAddress: "192.168.1.3",
          lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          isCurrent: false,
        },
      ];

      return mockSessions;
    } catch (error) {
      logger.error("Error getting user active sessions", { userId, error });
      throw new AppError("Failed to fetch active sessions", 500);
    }
  }

  /**
   * Terminate a user session
   */
  static async terminateSession({
    userId,
    sessionId,
    currentSession,
    request,
  }: {
    userId: string;
    sessionId: string;
    currentSession: AuthSession;
    request?: NextRequest;
  }) {
    try {
      // In a real application, you would invalidate the session in your database
      // For this example, we'll just log the action

      // Log the security event
      await this.logSecurityEvent({
        userId,
        eventType: SecurityEventType.SESSION_REVOKED,
        metadata: { sessionId },
        request,
      });

      return { success: true };
    } catch (error) {
      logger.error("Error terminating session", { userId, sessionId, error });
      throw new AppError("Failed to terminate session", 500);
    }
  }

  /**
   * Terminate all sessions except the current one
   */
  static async terminateAllSessions({
    userId,
    currentSessionId,
    request,
  }: {
    userId: string;
    currentSessionId: string;
    request?: NextRequest;
  }) {
    try {
      // In a real application, you would invalidate all sessions except the current one
      // For this example, we'll just log the action

      // Log the security event
      await this.logSecurityEvent({
        userId,
        eventType: SecurityEventType.ALL_SESSIONS_REVOKED,
        metadata: { currentSessionId },
        request,
      });

      return { success: true };
    } catch (error) {
      logger.error("Error terminating all sessions", { userId, error });
      throw new AppError("Failed to terminate all sessions", 500);
    }
  }

  /**
   * Check for suspicious activity
   */
  static async checkForSuspiciousActivity({
    userId,
    ipAddress,
    userAgent,
    request,
  }: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    request?: NextRequest;
  }) {
    try {
      // Extract IP and user agent from request if provided
      if (request) {
        if (!ipAddress) {
          ipAddress = getClientIp(request as any) || undefined;
        }

        if (!userAgent) {
          userAgent = request.headers.get("user-agent") || undefined;
        }
      }

      // Get user's recent login history
      const recentLogins = await prisma.securityLog.findMany({
        where: {
          userId,
          eventType: SecurityEventType.LOGIN_SUCCESS,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Check if this is a new IP address
      const isNewIp =
        ipAddress && !recentLogins.some((log) => log.ipAddress === ipAddress);

      // Check if this is a new device/user agent
      const isNewDevice =
        userAgent && !recentLogins.some((log) => log.userAgent === userAgent);

      // If new IP or device, log it
      if (isNewIp) {
        await this.logSecurityEvent({
          userId,
          eventType: SecurityEventType.NEW_LOCATION_DETECTED,
          ipAddress,
          userAgent,
          metadata: { newIp: ipAddress },
          request,
        });
      }

      if (isNewDevice) {
        await this.logSecurityEvent({
          userId,
          eventType: SecurityEventType.NEW_DEVICE_DETECTED,
          ipAddress,
          userAgent,
          metadata: { newDevice: userAgent },
          request,
        });
      }

      return {
        isNewIp,
        isNewDevice,
        isSuspicious: isNewIp || isNewDevice,
      };
    } catch (error) {
      logger.error("Error checking for suspicious activity", { userId, error });
      // Don't throw the error - this should not interrupt the main flow
      return {
        isNewIp: false,
        isNewDevice: false,
        isSuspicious: false,
        error: true,
      };
    }
  }
}

