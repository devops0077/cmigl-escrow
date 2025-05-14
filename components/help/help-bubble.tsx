"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  X,
  MessageCircle,
  Mail,
  FileQuestion,
  Phone,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";

type SupportChannel = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  action: () => void;
  color: string;
};

export function HelpBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    // Randomly set unread status for demo purposes
    const randomCheck = () => {
      const random = Math.random() > 0.7;
      setHasUnread(random);
    };

    randomCheck();
    const interval = setInterval(randomCheck, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY + 10) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 10) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const supportChannels: SupportChannel[] = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: <MessageCircle className="h-5 w-5" />,
      description: "Chat with us on WhatsApp",
      action: () => {
        window.open(
          "https://chat.whatsapp.com/JjD7zLq6BQr3mAcWqMP9Si",
          "_blank"
        );
      },
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      id: "email",
      name: "Email",
      icon: <Mail className="h-5 w-5" />,
      description: "Send us an email",
      action: () => {
        const subject = "Support Request from CMIGL Escrow";
        const body = `User: ${session?.user?.email || "Not logged in"}\nPage: ${window.location.href}\n\nHello, I need help with...`;
        window.location.href = `mailto:support@cmigl.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      },
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      id: "faq",
      name: "FAQ",
      icon: <FileQuestion className="h-5 w-5" />,
      description: "Browse our FAQ",
      action: () => {
        // This would link to your FAQ page
        window.open("/faq", "_blank");
      },
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      id: "call",
      name: "Call Us",
      icon: <Phone className="h-5 w-5" />,
      description: "Speak with support",
      action: () => {
        window.location.href = "tel:+1234567890";
      },
      color: "bg-yellow-500 hover:bg-yellow-600",
    },
  ];

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300 ease-in-out",
        isVisible ? "bottom-6 right-6" : "bottom-[-100px] right-6"
      )}
      aria-label="Help and support"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 mb-2 w-64 rounded-lg bg-white p-4 shadow-lg dark:bg-zinc-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Need Help?</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close help menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {supportChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    channel.action();
                    if (channel.id !== "faq") setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-white transition-all",
                    channel.color
                  )}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    {channel.icon}
                  </span>
                  <div className="text-left">
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-xs text-white/80">
                      {channel.description}
                    </div>
                  </div>
                  <ExternalLink className="ml-auto h-3 w-3 opacity-70" />
                </button>
              ))}
            </div>

            <div className="mt-3 text-center text-xs text-muted-foreground">
              <Link href="/help" className="underline hover:text-foreground">
                View all support options
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => {
                setIsOpen(!isOpen);
                if (hasUnread) setHasUnread(false);
              }}
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg"
              aria-label="Open help menu"
              aria-expanded={isOpen}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isOpen ? "close" : "help"}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative flex h-full w-full items-center justify-center"
                >
                  {isOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <HelpCircle size={25} className="h-6 w-6" />
                  )}

                  {hasUnread && !isOpen && (
                    <span className="absolute right-0 top-0 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isOpen ? "Close help menu" : "Get help"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
