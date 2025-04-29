import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAccountStatus } from "@/lib/auth-actions";

export async function GET(request: NextRequest) {
  try {
    const status = await getAccountStatus();
    return NextResponse.json({ data: status });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
