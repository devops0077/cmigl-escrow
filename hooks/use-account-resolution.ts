"use client";

import { useState } from "react";
import { logger } from "@/lib/logger";

type AccountDetails = {
  account_number: string;
  account_name: string;
  bank_id: number;
};

export function useAccountResolution() {
  const [accountName, setAccountName] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveAccount = async (accountNumber: string, bankCode: string) => {
    if (!accountNumber || accountNumber.length !== 10 || !bankCode) {
      setAccountName("");
      setError("Please provide a valid account number and bank");
      return null;
    }

    setIsResolving(true);
    setError(null);

    try {
      const response = await fetch("/api/banks/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountNumber, bankCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Could not resolve account");
      }

      const data = await response.json();
      setAccountName(data.accountDetails.account_name);
      return data.accountDetails as AccountDetails;
    } catch (error) {
      logger.error("Account resolution error", { error });
      const errorMessage =
        error instanceof Error ? error.message : "Could not verify account";
      setError(errorMessage);
      setAccountName("");
      return null;
    } finally {
      setIsResolving(false);
    }
  };

  return {
    accountName,
    isResolving,
    error,
    resolveAccount,
    reset: () => {
      setAccountName("");
      setError(null);
    },
  };
}
