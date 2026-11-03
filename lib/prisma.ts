// import { PrismaClient } from "@prisma/client";

import { PrismaClient } from "./generated/prisma";

// Prisma 6 engine pool: idle connections live up to 300s by default
// (max_idle_connection_lifetime), long enough for the box's TCP proxy /
// NAT to kill them silently. A query handed such a dead connection then
// hangs instead of failing, which is how auth discovery calls stretched
// to 3-5 minutes (Nov 2026 stall). Cap idle lifetime at 10s so stale
// connections are evicted before they can be killed unnoticed. Applied
// in code (not the Vercel env var) so migrations, which read
// DATABASE_URL directly from the schema, are unaffected.
const databaseUrl = process.env.DATABASE_URL;
const poolUrl = databaseUrl
  ? databaseUrl +
    (databaseUrl.includes("?") ? "&" : "?") +
    "max_idle_connection_lifetime=10"
  : undefined;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(poolUrl ? { datasources: { db: { url: poolUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
