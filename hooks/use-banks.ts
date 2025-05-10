"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

type Bank = {
  code: string;
  name: string;
  slug?: string;
  active?: boolean;
};

export function useBanks() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBanks = async () => {
    if (banks.length > 0) return; // Don't fetch if we already have banks

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/banks/list");
      if (!response.ok) {
        throw new Error("Failed to fetch banks");
      }

      const data = await response.json();
      // Sort banks alphabetically
      const sortedBanks = data.banks.sort((a: Bank, b: Bank) =>
        a.name.localeCompare(b.name)
      );
      setBanks(sortedBanks);
    } catch (error) {
      logger.error("Error fetching banks", { error });
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load banks";
      setError(errorMessage);
      toast.error("Failed to load banks", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch banks on mount
  useEffect(() => {
    fetchBanks();
  }, []);

  return {
    banks,
    isLoading,
    error,
    refetch: fetchBanks,
  };
}
