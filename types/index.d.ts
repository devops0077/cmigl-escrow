import { User as PrismaUser } from "@/lib/generated/prisma";

declare module "next-auth" {
  interface User extends PrismaUser {}

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends PrismaUser {}
}

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
