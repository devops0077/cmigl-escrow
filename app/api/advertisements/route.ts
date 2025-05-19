import { getAdsForDisplay } from "@/lib/advertisement-actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get("placement") || "GLOBAL";

    const ads = await getAdsForDisplay(placement);

    return NextResponse.json(ads);
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    return NextResponse.json(
      { error: "Failed to fetch advertisements" },
      { status: 500 }
    );
  }
}
