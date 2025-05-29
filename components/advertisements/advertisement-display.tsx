"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getAdsForDisplay,
  recordAdImpression,
  recordAdClick,
} from "@/lib/advertisement-actions";
import { AdvertisementBanner } from "./advertisement-banner";
import { AdvertisementPopup } from "./advertisement-popup";

interface AdvertisementDisplayProps {
  placement:
    | "HOMEPAGE"
    | "DASHBOARD"
    | "SIDEBAR"
    | "TRANSACTION_PAGE"
    | "WALLET_PAGE"
    | "PROFILE_PAGE"
    | "GLOBAL";
  maxAds?: number;
  className?: string;
}

export function AdvertisementDisplay({
  placement,
  maxAds = 1,
  className = "",
}: AdvertisementDisplayProps) {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setIsLoading(true);
        const data = await getAdsForDisplay(placement);
        // Limit to maxAds
        setAds(data.slice(0, maxAds));

        // Record impressions
        data.slice(0, maxAds).forEach((ad) => {
          recordAdImpression(ad?.id, placement);
        });
      } catch (error) {
        console.error("Error fetching advertisements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAds();
  }, [placement, maxAds]);

  const handleAdClick = async (adId: string, linkUrl?: string) => {
    // Record click
    await recordAdClick(adId, placement);

    // Navigate to link if provided
    if (linkUrl) {
      if (linkUrl.startsWith("/")) {
        router.push(linkUrl);
      } else {
        window.open(linkUrl, "_blank");
      }
    }
  };

  if (isLoading || ads.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {ads.map((ad) => {
        switch (ad.type) {
          case "POPUP":
            return (
              <AdvertisementPopup
                key={ad.id}
                ad={ad}
                onClose={() => {}}
                onClick={() => handleAdClick(ad.id, ad.content.linkUrl)}
              />
            );
          case "BANNER":
          case "FLASH":
          case "TEXT":
          case "REWARD_PROMO":
          default:
            return (
              <AdvertisementBanner
                key={ad.id}
                ad={ad}
                onClick={() => handleAdClick(ad.id, ad.content.linkUrl)}
              />
            );
        }
      })}
    </div>
  );
}
