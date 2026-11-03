import { NextResponse } from "next/server";

// Retired: email sending moved server-side into EmailService (Resend API).
// This endpoint was unauthenticated, so anyone could POST to it and send
// mail from the escrow domain. It no longer sends anything.
export async function POST() {
  return NextResponse.json(
    { error: "Gone: email sending is handled server-side now" },
    { status: 410 }
  );
}
