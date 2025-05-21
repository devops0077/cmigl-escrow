"use client";

import { useState } from "react";
import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationSound } from "@/lib/push-notification";
import { toast } from "sonner";

export function PushNotificationButton() {
  const {
    isSupported,
    isSubscribed,
    isEnabled,
    currentSound,
    isLoading,
    toggleSubscription,
    updateSound,
    playTestSound,
    getAvailableSounds,
  } = usePushNotifications();

  const [isPlaying, setIsPlaying] = useState(false);

  if (!isSupported || !isEnabled) {
    return null;
  }

  const handlePlaySound = (sound: NotificationSound) => {
    if (isPlaying) return;

    setIsPlaying(true);
    playTestSound(sound);
    setTimeout(() => setIsPlaying(false), 2000); // Prevent rapid clicking
  };

  const availableSounds = getAvailableSounds();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="-ml-7">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full "
          disabled={isLoading}
          aria-label={
            isSubscribed
              ? "Manage push notifications"
              : "Enable push notifications"
          }
        >
          {isSubscribed ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Push Notifications</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => {
            let permission = Notification.permission;
            (permission === "default"
              ? Notification.requestPermission()
              : Promise.resolve(permission)
            )
              .then((result) => {
                permission = result;
                if (permission !== "granted") {
                  toast.error("Notification permission denied");
                  return;
                }
                return toggleSubscription();
              })
              .catch(() => {
                toast.error("Failed to enable notification");
              });
          }}
          disabled={isLoading}
        >
          {isSubscribed ? (
            <>
              <BellOff className="mr-2 h-4 w-4" />
              <span>Disable for this device</span>
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              <span>Enable for this device</span>
            </>
          )}
        </DropdownMenuItem>

        {isSubscribed && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Notification Sound</DropdownMenuLabel>
            {availableSounds.map((sound) => (
              <DropdownMenuItem
                key={sound.id}
                onClick={() => updateSound(sound.id as NotificationSound)}
                className="flex justify-between"
              >
                <div className="flex items-center">
                  {sound.id === "none" ? (
                    <VolumeX className="mr-2 h-4 w-4" />
                  ) : (
                    <Volume2 className="mr-2 h-4 w-4" />
                  )}
                  <span>{sound.name}</span>
                </div>
                <div className="flex items-center">
                  {currentSound === sound.id && (
                    <span className="mr-2 text-xs">✓</span>
                  )}
                  {sound.id !== "none" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySound(sound.id as NotificationSound);
                      }}
                      disabled={isPlaying}
                    >
                      <Volume2 className="h-3 w-3" />
                      <span className="sr-only">Test sound</span>
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
