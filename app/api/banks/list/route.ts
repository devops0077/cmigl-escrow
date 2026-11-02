import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { paystackService } from "@/lib/paystack-service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const banks = await paystackService.listBanks();

    // Filter out inactive banks
    const activeBanks = banks.filter((bank: any) => bank.active === true);

    return NextResponse.json({
      banks: activeBanks,
    });
  } catch (error) {
    logger.error("Error fetching banks:", error);
    return NextResponse.json(
      { error: "Failed to fetch banks" },
      { status: 500 }
    );
  }
}

