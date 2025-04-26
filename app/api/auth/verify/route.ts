import { type NextRequest, NextResponse } from "next/server";
import { verifyEmail } from "@/lib/auth-actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Verification token is required" },
      { status: 400 }
    );
  }

  try {
    const result = await verifyEmail(token);

    // Redirect to payment page with userId
    return NextResponse.redirect(
      new URL(`/auth/payment?userId=${result.userId}`, request.url)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 400 }
    );
  }
}
