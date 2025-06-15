"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  pusherClient,
  getUserPresenceChannel,
  PUSHER_EVENTS,
} from "@/lib/pusher-client";
import { formatDistanceToNow } from "date-fns";

interface PresenceIndicatorProps {
  userId: string;
  userName?: string;
  showLastSeen?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PresenceIndicator({
  userId,
  userName,
  showLastSeen = true,
  size = "md",
}: PresenceIndicatorProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    const channel = pusherClient.subscribe(getUserPresenceChannel(userId));

    // Listen for presence events
    channel.bind(PUSHER_EVENTS.USER_ONLINE, (data: any) => {
      if (data.userId === userId) {
        setIsOnline(true);
        setLastSeen(new Date());
      }
    });

    channel.bind(PUSHER_EVENTS.USER_OFFLINE, (data: any) => {
      if (data.userId === userId) {
        setIsOnline(false);
        setLastSeen(new Date(data.timestamp));
      }
    });

    return () => {
      channel.unbind(PUSHER_EVENTS.USER_ONLINE);
      channel.unbind(PUSHER_EVENTS.USER_OFFLINE);
      pusherClient.unsubscribe(getUserPresenceChannel(userId));
    };
  }, [userId]);

  if (!userId) return null;

  return (
    <Badge
      variant="secondary"
      className={`gap-1 border-0 font-normal ${size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-sm"}`}
    >
      {isOnline ? (
        <>Online</>
      ) : showLastSeen && lastSeen ? (
        <>Last seen {formatDistanceToNow(lastSeen, { addSuffix: true })}</>
      ) : (
        <>Offline</>
      )}
    </Badge>
  );
}
