import { redirect } from "next/navigation";

/**
 * Registration fee has been removed.
 * Users are granted access immediately after email verification.
 * This route is kept to gracefully redirect any stale links.
 */
export default function PaymentPage() {
  redirect("/dashboard");
}
