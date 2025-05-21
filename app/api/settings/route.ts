import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SettingsService } from "@/lib/settings-service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await SettingsService.getUserSettings(session.user.id);

    return NextResponse.json(settings);
  } catch (error) {
    logger.error("Error fetching user settings", { error });
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const updatedSettings = await SettingsService.updateUserSettings(
      session.user.id,
      data
    );

    return NextResponse.json(updatedSettings);
  } catch (error) {
    logger.error("Error updating user settings", { error });
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await SettingsService.resetUserSettings(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error resetting user settings", { error });
    return NextResponse.json(
      { error: "Failed to reset settings" },
      { status: 500 }
    );
  }
}
