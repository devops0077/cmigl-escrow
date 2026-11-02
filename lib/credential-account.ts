import { hashPassword } from "better-auth/crypto";
import { prisma } from "./prisma";

/**
 * Better Auth credential accounts (email/password sign-in).
 *
 * Convention (verified against better-auth 1.7 internals): a credential
 * account row has providerId "credential" and accountId equal to the
 * user id. Sign-in looks the account up by exactly that pair, so every
 * code path that creates a user with a password MUST create this row —
 * a user without one cannot sign in with email/password, even though
 * the User row exists.
 *
 * Hashes use Better Auth's default scrypt hasher (only the verify side
 * is customised, for legacy bcrypt — see auth.ts). The legacy
 * User.password column is never written here.
 */
export async function createCredentialAccount(
  userId: string,
  plainPassword: string
): Promise<void> {
  await prisma.account.create({
    data: {
      userId,
      accountId: userId,
      providerId: "credential",
      password: await hashPassword(plainPassword),
    },
  });
}

/** Create or replace the credential account's password hash. */
export async function setCredentialPassword(
  userId: string,
  plainPassword: string
): Promise<void> {
  const password = await hashPassword(plainPassword);
  await prisma.account.upsert({
    where: {
      providerId_accountId: { providerId: "credential", accountId: userId },
    },
    create: {
      userId,
      accountId: userId,
      providerId: "credential",
      password,
    },
    update: {
      password,
    },
  });
}
