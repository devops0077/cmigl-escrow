import { NextResponse } from "next/server";

/**
 * Registration fee has been removed.
 * Users are activated automatically upon email verification.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Registration fee is no longer required." },
    { status: 410 }
  );
}
