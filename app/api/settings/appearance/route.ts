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

    const appearanceSettings = await SettingsService.getAppearanceSettings(
      session.user.id
    );

    return NextResponse.json(appearanceSettings);
  } catch (error) {
    logger.error("Error fetching appearance settings", { error });
    return NextResponse.json(
      { error: "Failed to fetch appearance settings" },
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

    const updatedSettings = await SettingsService.updateAppearanceSettings(
      session.user.id,
      data
    );

    return NextResponse.json(updatedSettings);
  } catch (error) {
    logger.error("Error updating appearance settings", { error });
    return NextResponse.json(
      { error: "Failed to update appearance settings" },
      { status: 500 }
    );
  }
}
