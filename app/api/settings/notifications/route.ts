import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { SettingsService } from "@/lib/settings-service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationSettings = await SettingsService.getNotificationSettings(
      session.user.id
    );

    return NextResponse.json(notificationSettings);
  } catch (error) {
    logger.error("Error fetching notification settings", { error });
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const updatedSettings = await SettingsService.updateNotificationSettings(
      session.user.id,
      data
    );

    return NextResponse.json(updatedSettings);
  } catch (error) {
    logger.error("Error updating notification settings", { error });
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}

