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

    const localeSettings = await SettingsService.getLocaleSettings(
      session.user.id
    );

    return NextResponse.json(localeSettings);
  } catch (error) {
    logger.error("Error fetching locale settings", { error });
    return NextResponse.json(
      { error: "Failed to fetch locale settings" },
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

    const updatedSettings = await SettingsService.updateLocaleSettings(
      session.user.id,
      data
    );

    return NextResponse.json(updatedSettings);
  } catch (error) {
    logger.error("Error updating locale settings", { error });
    return NextResponse.json(
      { error: "Failed to update locale settings" },
      { status: 500 }
    );
  }
}
