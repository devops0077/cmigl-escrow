import { type NextRequest, NextResponse } from "next/server";
import { payRegistrationFee } from "@/lib/auth-actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, paymentReference } = body;

    if (!userId || !paymentReference) {
      return NextResponse.json(
        { error: "User ID and payment reference are required" },
        { status: 400 }
      );
    }

    await payRegistrationFee(userId, paymentReference);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration fee payment error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Payment processing failed",
      },
      { status: 400 }
    );
  }
}
