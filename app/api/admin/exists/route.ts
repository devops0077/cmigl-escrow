import { ensureAdminExists } from "@/lib/admin-actions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const exist = await ensureAdminExists();
    return new NextResponse(exist.message, { status: 200 });
  } catch (error) {
    console.error("Error ensuring admin exists:", error);
    return new NextResponse("Error ensuring admin exists", { status: 500 });
  }
}
