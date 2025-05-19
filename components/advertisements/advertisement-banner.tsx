"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdvertisementBannerProps {
  ad: any;
  onClick: () => void;
  className?: string;
}

export function AdvertisementBanner({
  ad,
  onClick,
  className,
}: AdvertisementBannerProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // For flash banners, handle animation
  useEffect(() => {
    if (ad.type === "FLASH") {
      const animationInterval = setInterval(() => {
        setIsAnimating(true);
        setTimeout(
          () => setIsAnimating(false),
          (ad.content.animationDuration || 1) * 1000
        );
      }, 5000); // Animate every 5 seconds

      return () => clearInterval(animationInterval);
    }
  }, [ad]);

  // Determine banner size
  const getBannerSize = () => {
    if (ad.content.bannerSize === "small") {
      return "h-20";
    } else if (ad.content.bannerSize === "large") {
      return "h-60";
    } else if (ad.content.bannerSize === "custom" && ad.content.bannerHeight) {
      return `h-[${ad.content.bannerHeight}px]`;
    } else {
      return "h-40"; // medium (default)
    }
  };

  // Get animation class
  const getAnimationClass = () => {
    if (!isAnimating || ad.type !== "FLASH") return "";

    const animationType = ad.content.animationData?.type || "fade";

    switch (animationType) {
      case "fade":
        return "animate-pulse";
      case "slide":
        return "animate-slide";
      case "pulse":
        return "animate-bounce";
      default:
        return "animate-pulse";
    }
  };

  // Render reward promo differently
  if (ad.type === "REWARD_PROMO" && ad.linkedReward) {
    return (
      <Card
        className={cn(
          "overflow-hidden cursor-pointer transition-all hover:shadow-md",
          getBannerSize(),
          getAnimationClass(),
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-0 h-full">
          <div className="flex flex-col h-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4">
            <div className="text-sm font-medium uppercase tracking-wide mb-1">
              Special Reward
            </div>
            <h3 className="text-xl font-bold mb-2">
              {ad.content.title || ad.linkedReward.name}
            </h3>
            <p className="text-sm mb-auto">
              {ad.content.description || ad.linkedReward.description}
            </p>
            <Button
              variant="secondary"
              className="mt-2 self-start bg-white text-indigo-600 hover:bg-gray-100"
            >
              {ad.content.ctaText || "Claim Reward"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Standard banner
  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all hover:shadow-md",
        getBannerSize(),
        getAnimationClass(),
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0 h-full">
        {ad.content.imageUrl ? (
          <div className="relative h-full w-full">
            <Image
              src={ad.content.imageUrl || "/placeholder.svg"}
              alt={ad.content.title || ad.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-4 text-white">
              <h3 className="text-xl font-bold mb-1">{ad.content.title}</h3>
              {ad.content.description && (
                <p className="text-sm mb-2">{ad.content.description}</p>
              )}
              {ad.content.ctaText && (
                <Button variant="secondary" size="sm" className="self-start">
                  {ad.content.ctaText}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col justify-center p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <h3 className="text-xl font-bold mb-2">{ad.content.title}</h3>
            {ad.content.description && (
              <p className="text-sm mb-4">{ad.content.description}</p>
            )}
            {ad.content.ctaText && (
              <Button variant="secondary" size="sm" className="self-start">
                {ad.content.ctaText}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
