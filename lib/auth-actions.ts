"use server";

import { prisma } from "./prisma";
import { createCredentialAccount, setCredentialPassword } from "./credential-account";
import { emailService } from "./email-service";
import { nanoid } from "nanoid";
import {
  AppError,
  CustomError,
  UserNotFoundError,
} from "./error-class";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function registerUser({
  name,
  email,
  phone,
  username,
  password,
  passportImage,
  termsAccepted,
}: {
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  passportImage: string;
  termsAccepted: boolean;
}) {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }, { phone }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error("Email already in use");
    }
    if (existingUser.username === username) {
      throw new Error("Username already taken");
    }
    if (existingUser.phone === phone) {
      throw new Error("Phone number already in use");
    }
  }

  // Create verification token
  const token = nanoid(36);
  const tokenExpiry = new Date();
  tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token expires in 24 hours

  // Create user (no password column: the credential lives in the
  // Better Auth Account row created below, hashed with scrypt).
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      username,
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

  await createCredentialAccount(user.id, password);

  // Send verification email
  try {
    await emailService.sendVerificationEmail(email, token);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // Continue even if email fails
  }

  revalidatePath("/auth/login");
  return user;
}

/**
 * Resolve a login identifier (email, username or phone) to the account
 * email for Better Auth's email sign-in, which accepts email only.
 * Returns null for unknown identifiers so the login page can fail
 * exactly like a wrong password.
 */
export async function resolveLoginEmail(
  identifier: string
): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { phone: identifier }],
    },
    select: { email: true },
  });
  return user?.email ?? null;
}

export async function verifyEmail(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken) {
    throw new CustomError("Invalid verification token");
  }

  if (verificationToken.expires < new Date()) {
    throw new CustomError("Verification token has expired");
  }

  // Mark email as verified and activate the account immediately.
  // emailVerified is a boolean under Better Auth (converted from the
  // old DateTime column by the better-auth migration).
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: true, isActive: true, status: "ACTIVE" },
  });

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  return {
    success: true,
    userId: verificationToken.user.id,
    email: verificationToken.user.email,
  };
}

export async function payRegistrationFee(
  userId: string,
  paymentReference: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { registrationFee: true, wallet: true },
  });

  if (!user) {
    throw new UserNotFoundError("User not found");
  }

  if (!user.registrationFee) {
    throw new CustomError("Registration fee record not found");
  }

  if (user.registrationFee.paid) {
    throw new CustomError("Registration fee already paid");
  }

  // Update registration fee status
  await prisma.registrationFee.update({
    where: { userId },
    data: {
      paid: true,
      reference: paymentReference,
    },
  });

  // Activate user account
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

  // Record the payment in wallet transactions
  await prisma.walletTransaction.create({
    data: {
      walletId: user.wallet!.id,
      amount: -500, // 500 Naira fee
      type: "REGISTRATION_FEE",
      status: "COMPLETED",
      reference: paymentReference,
      description: "One-time registration fee",
    },
  });

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(
      user.email!,
      user.name || user.username || "User"
    );
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    // Continue even if email fails
  }

  revalidatePath("/auth/login");
  return { success: true };
}

export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.emailVerified) {
    throw new Error("Email already verified");
  }

  // Delete any existing tokens
  await prisma.verificationToken.deleteMany({
    where: { userId: user.id },
  });

  // Create new verification token
  const token = nanoid(32); // Generate a random token
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hour expiry

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      expires,
    },
  });

  // Send verification email
  await emailService.sendVerificationEmail(email, token);

  return { success: true };
}

// Add password reset functionality
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists for security
    return { success: true };
  }

  // Delete any existing tokens
  await prisma.verificationToken.deleteMany({
    where: { userId: user.id },
  });

  // Create reset token
  const token = `reset_${nanoid(32)}`;
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour expiry

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      expires,
    },
  });

  // Send password reset email
  try {
    await emailService.sendPasswordResetEmail(email, token);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new AppError("Failed to send password reset email");
  }

  return { success: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken || !token.startsWith("reset_")) {
    throw new Error("Invalid reset token");
  }

  if (verificationToken.expires < new Date()) {
    throw new Error("Reset token has expired");
  }

  // New credential hash (scrypt, via Better Auth's default hasher) on
  // the Account row. The legacy User.password column is left untouched:
  // it is only read by the one-time migration script, and overwriting
  // it here could clobber a not-yet-migrated hash.
  await setCredentialPassword(verificationToken.userId, newPassword);

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  return { success: true };
}

export async function getAccountStatus() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isActive: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
