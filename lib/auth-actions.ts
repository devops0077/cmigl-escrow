"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { emailService } from "./email-service";
import { nanoid } from "nanoid";
import {
  AppError,
  CustomError,
  InActiveAccountError,
  UserNotFoundError,
} from "./error-class";
import { auth } from "@/auth";
import { _escrowConfig } from "@/config";

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
      registrationFee: {
        create: {
          amount: _escrowConfig.registrationFee,
          paid: false,
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
  return user;
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

  // Mark email as verified but user remains inactive until registration fee is paid
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: new Date(), isActive: true },
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

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    return null;
  }

  const isValidPassword = await compare(password, user.password);

  if (!isValidPassword) {
    return null;
  }

  // Check if user is active (has paid registration fee)
  // if (!user.isActive) {
  //   throw new InActiveAccountError(
  //     "inactive_account"
  //     // "Account not active. Please complete registration by paying the one-time fee."
  //   );
  // }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    image: user.image,
    passportImage: user.passportImage,
    isActive: user.isActive,
    status: user.status,
    emailVerified: user.emailVerified,
    phone: user.phone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
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

  // Hash new password
  const hashedPassword = await hash(newPassword, 10);

  // Update user password
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { password: hashedPassword },
  });

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  return { success: true };
}

export async function getAccountStatus() {
  const session = await auth();
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
