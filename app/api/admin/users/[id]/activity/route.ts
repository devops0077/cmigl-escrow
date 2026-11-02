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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminPermission();
    const userId = (await params).id;

    // Get security logs
    const securityLogs = await prisma.securityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Calculate statistics
    const totalLogins = await prisma.securityLog.count({
      where: {
        userId,
        eventType: "LOGIN_SUCCESS",
      },
    });

    const failedLogins = await prisma.securityLog.count({
      where: {
        userId,
        eventType: "LOGIN_FAILED",
      },
    });

    const lastLogin = await prisma.securityLog.findFirst({
      where: {
        userId,
        eventType: "LOGIN_SUCCESS",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    const uniqueIPs = await prisma.securityLog.groupBy({
      by: ["ipAddress"],
      where: {
        userId,
        ipAddress: { not: null },
      },
    });

    const stats = {
      totalLogins,
      failedLogins,
      lastLogin: lastLogin?.createdAt?.toISOString() || null,
      uniqueIPs: uniqueIPs.length,
    };

    // Format security logs
    const formattedLogs = securityLogs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      location: log.location,
      successful: log.successful,
      createdAt: log.createdAt.toISOString(),
      metadata: log.metadata,
    }));

    return NextResponse.json({
      securityLogs: formattedLogs,
      stats,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity data" },
      { status: 500 }
    );
  }
}

