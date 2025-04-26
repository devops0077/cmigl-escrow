"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { emailService } from "./email-service";
import { nanoid } from "nanoid";

export async function registerUser({
  name,
  email,
  username,
  password,
}: {
  name: string;
  email: string;
  username: string;
  password: string;
}) {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error("Email already in use");
    }
    if (existingUser.username === username) {
      throw new Error("Username already taken");
    }
  }

  // Hash password
  const hashedPassword = await hash(password, 10);

  // Create user (inactive until registration fee is paid)
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      isActive: false,
      wallet: {
        create: {
          balance: 0,
        },
      },
      registrationFee: {
        create: {
          amount: 500, // 500 Naira registration fee
          paid: false,
        },
      },
    },
  });

  // Create verification token
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
  try {
    await emailService.sendVerificationEmail(email, token);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // Continue with registration even if email fails
  }

  revalidatePath("/auth/login");
  return {
    success: true,
    userId: user.id,
    email: user.email,
  };
}

export async function verifyEmail(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken) {
    throw new Error("Invalid verification token");
  }

  if (verificationToken.expires < new Date()) {
    throw new Error("Verification token has expired");
  }

  // Mark email as verified but user remains inactive until registration fee is paid
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: new Date() },
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
    throw new Error("User not found");
  }

  if (!user.registrationFee) {
    throw new Error("Registration fee record not found");
  }

  if (user.registrationFee.paid) {
    throw new Error("Registration fee already paid");
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
  if (!user.isActive) {
    throw new Error(
      "Account not active. Please complete registration by paying the one-time fee."
    );
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
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
