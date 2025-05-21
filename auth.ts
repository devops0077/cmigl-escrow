import NextAuth from "next-auth";

import {
  SecurityEventType,
  UserRole,
  UserStatus,
} from "./lib/generated/prisma";
import { verifyCredentials } from "./lib/auth-actions";
import Credentials from "next-auth/providers/credentials";
import axios from "axios";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // @ts-ignore
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await verifyCredentials(
          credentials.email as string,
          credentials.password as string
        );

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.passportImage || user.image;
        token.role = user.role;
        token.username = user.username;
        token.isActive = user.isActive;
        token.restricted = user.restricted;
        token.status = user.status;
        token.phone = user.phone;
        token.username = user.username;
        token.emailVerified = user.emailVerified;
        token.bio = user.bio;
        token.address = user.address;
      }
      if (trigger === "update") {
        if (session.user) {
          return {
            ...token,
            isActive: session.user.isActive,
            restricted: session.user.restricted,
            status: session.user.status,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
            address: session.user.address,
            bio: session.user.bio,
          };
        }
      }
      return token;
    },
    async session({ session, token, trigger }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.user.role = token.role as UserRole;
        session.user.username = token.username as string;
        session.user.isActive = token.isActive as boolean;
        session.user.status = token.status as UserStatus;
        session.user.restricted = token.restricted as boolean;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.phone = token.phone as string;
        session.user.address = token.address as string;
        session.user.bio = token.bio as string;
        session.user.createdAt = token.createdAt as Date;
        session.user.updatedAt = token.updatedAt as Date;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  session: {
    maxAge: 1 * 24 * 60 * 60, // 1 day
  },
});
