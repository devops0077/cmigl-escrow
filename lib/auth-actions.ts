"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";

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

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      username,
      password: hashedPassword,
      wallet: {
        create: {
          balance: 0,
        },
      },
    },
  });

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

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
  };
}
