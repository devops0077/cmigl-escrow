import { UserRestriction } from "@/lib/generated/prisma";

export type RestrictionReason =
  | "SUSPICIOUS_ACTIVITY"
  | "PAYMENT_FRAUD"
  | "TERMS_VIOLATION"
  | "IDENTITY_VERIFICATION"
  | "MULTIPLE_ACCOUNTS"
  | "OTHER";

export interface RestrictionContextType {
  isRestricted: boolean;
  restriction: UserRestriction | null;
  restrictions: UserRestriction[] | null;
  checkRestriction: () => Promise<boolean>;
  submitAppeal: (appealText: string) => Promise<boolean>;
}
