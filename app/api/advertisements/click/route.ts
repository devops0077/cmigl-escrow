import { recordAdClick } from "@/lib/advertisement-actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { adId, placement } = await request.json();

    if (!adId || !placement) {
      return NextResponse.json(
        { error: "Missing adId or placement" },
        { status: 400 }
      );
    }

    await recordAdClick(adId, placement);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording click:", error);
    return NextResponse.json(
      { error: "Failed to record click" },
      { status: 500 }
    );
  }
}
