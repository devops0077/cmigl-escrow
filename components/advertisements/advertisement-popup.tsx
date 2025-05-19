"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AdvertisementPopupProps {
  ad: any;
  onClose: () => void;
  onClick: () => void;
}

export function AdvertisementPopup({
  ad,
  onClose,
  onClick,
}: AdvertisementPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show popup after the specified delay
    const delay = ad.content.popupTiming || 5; // Default 5 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [ad.content.popupTiming]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleClick = () => {
    onClick();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        {ad.content.dismissible !== false && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}

        <DialogHeader>
          <DialogTitle>{ad.content.title}</DialogTitle>
          {ad.content.description && (
            <DialogDescription>{ad.content.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {ad.content.imageUrl && (
            <div className="relative h-40 w-full">
              <Image
                src={ad.content.imageUrl || "/placeholder.svg"}
                alt={ad.content.title || ad.name}
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}

          <Button onClick={handleClick} className="w-full">
            {ad.content.ctaText || "Learn More"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
