/**
 * One-time migration: copy legacy NextAuth bcrypt password hashes into
 * Better Auth credential accounts.
 *
 * Background: under NextAuth, passwords lived in User.password as
 * bcrypt hashes (bcryptjs, cost 10). Under Better Auth, email/password
 * sign-in reads Account.password on the row with providerId
 * "credential" and accountId = user id. Without this script, existing
 * users would have no credential account and could not sign in at all.
 *
 * Run AFTER applying prisma/migrations/20261102190000_better_auth and
 * regenerating the Prisma client, and BEFORE deploying the Better Auth
 * code (the new Account rows are inert to the old code, so this order
 * has no downtime window; running it after deploy would lock legacy
 * users out until it runs).
 *
 *   DATABASE_URL=... bun scripts/migrate-legacy-passwords.ts
 *
 * Safety:
 * - Only creates an account where none exists for that user; existing
 *   credential accounts are never overwritten (so a user who already
 *   reset their password to scrypt keeps the scrypt hash).
 * - Never prints password hashes — only counts and user ids.
 * - Idempotent: safe to re-run; the second run reports all skipped.
 * - Does NOT delete User.password. Leave that column until the
 *   migration is verified in production, then drop it in a follow-up
 *   migration.
 */
import { prisma } from "../lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    where: { password: { not: null } },
    select: { id: true, email: true },
  });

  let created = 0;
  let skippedExisting = 0;
  let skippedEmpty = 0;

  for (const user of users) {
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!full?.password) {
      skippedEmpty++;
      continue;
    }
    const existing = await prisma.account.findFirst({
      where: { providerId: "credential", accountId: user.id },
    });
    if (existing) {
      skippedExisting++;
      continue;
    }
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: full.password,
      },
    });
    created++;
    console.log(`created credential account for user ${user.id}`);
  }

  console.log(
    `done: ${created} created, ${skippedExisting} already had a credential account, ${skippedEmpty} had an empty password`
  );
}

main()
  .catch((error) => {
    console.error("migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
