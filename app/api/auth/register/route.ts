import { emailService } from "@/lib/email-service";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      username,
      password,
      passportImage,
      termsAccepted,
    } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }, { phone }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return new NextResponse(
          JSON.stringify({
            error: "Email already in use",
            message: "Email already in use",
          }),
          { status: 400 }
        );
      }
      if (existingUser.username === username) {
        return new NextResponse(
          JSON.stringify({
            error: "Username already taken",
            message: "Username already taken",
          }),
          { status: 400 }
        );
      }
      if (existingUser.phone === phone) {
        return new NextResponse(
          JSON.stringify({
            error: "Phone number already in use",
            message: "Phone number already in use",
          }),
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create verification token
    const token = nanoid(36);
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token expires in 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        username,
        password: hashedPassword,
        passportImage,
        termsAccepted,
        verificationToken: {
          create: {
            token,
            expires: tokenExpiry,
          },
        },
        wallet: {
          create: {
            balance: 0,
            currency: "NGN",
          },
        },
      },
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, token);
    } catch (error) {
      console.error("Failed to send verification email:", error);
      // Continue even if email fails
    }

    revalidatePath("/auth/login");
    return new NextResponse(
      JSON.stringify({
        message:
          "Registration successful. Please check your email to verify your account.",
      }),
      {
        status: 200,
      }
    );
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({
        error: error.message,
        message: "Internal server error",
      }),
      {
        status: 500,
      }
    );
  }
};
