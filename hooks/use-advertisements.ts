"use client";

import { useState, useEffect } from "react";

interface Advertisement {
  id: string;
  name: string;
  type: string;
  content: any;
  status: string;
  startDate: string;
  endDate?: string;
  linkedReward?: {
    id: string;
    name: string;
    description?: string;
  };
}

export function useAdvertisements(placement: string) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAds() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/advertisements?placement=${placement}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch advertisements");
        }

        const data = await response.json();
        setAds(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error("Error fetching advertisements:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAds();
  }, [placement]);

  const recordImpression = async (adId: string) => {
    try {
      await fetch("/api/advertisements/impression", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adId, placement }),
      });
    } catch (err) {
      console.error("Error recording impression:", err);
    }
  };

  const recordClick = async (adId: string) => {
    try {
      await fetch("/api/advertisements/click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adId, placement }),
      });
    } catch (err) {
      console.error("Error recording click:", err);
    }
  };

  return { ads, isLoading, error, recordImpression, recordClick };
}
