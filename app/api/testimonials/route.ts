import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get public feedback to use as testimonials
    const testimonials = await prisma.feedback.findMany({
      where: {
        isPublic: true,
      },
      include: {
        giver: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6, // Limit to 6 testimonials
    });

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
