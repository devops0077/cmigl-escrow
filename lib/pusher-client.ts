"use client";

import Pusher from "pusher-js";

if (
  !process.env.NEXT_PUBLIC_PUSHER_KEY ||
  !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
) {
  throw new Error("Missing Pusher client environment variables");
}

// Singleton pattern for Pusher client
class PusherClient {
  private static instance: Pusher | null = null;
  private static connecting = false;

  static getInstance(): Pusher {
    if (!PusherClient.instance && !PusherClient.connecting) {
      PusherClient.connecting = true;

      PusherClient.instance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
        auth: {
          headers: {
            "Content-Type": "application/json",
          },
        },
        enabledTransports: ["ws", "wss"],
        forceTLS: true,
      });

      // Connection event handlers
      PusherClient.instance.connection.bind("connected", () => {
        console.log("Pusher connected");
        PusherClient.connecting = false;
      });

      PusherClient.instance.connection.bind("disconnected", () => {
        console.log("Pusher disconnected");
      });

      PusherClient.instance.connection.bind("error", (error: any) => {
        console.error("Pusher connection error:", error);
        PusherClient.connecting = false;
      });
    }

    return PusherClient.instance!;
  }

  static disconnect() {
    if (PusherClient.instance) {
      PusherClient.instance.disconnect();
      PusherClient.instance = null;
      PusherClient.connecting = false;
    }
  }
}

export const pusherClient = PusherClient.getInstance();

// Helper functions for channel management
export const getConversationChannel = (userId1: string, userId2: string) => {
  const sortedIds = [userId1, userId2].sort();
  return `conversation-${sortedIds[0]}-${sortedIds[1]}`;
};

export const getUserPresenceChannel = (userId: string) => {
  return `presence-user-${userId}`;
};

export const getAdminPresenceChannel = () => {
  return "presence-admins";
};

// Event types (matching server-side)
export const PUSHER_EVENTS = {
  NEW_MESSAGE: "new-message",
  MESSAGE_READ: "message-read",
  MESSAGE_DELIVERED: "message-delivered",
  USER_TYPING: "user-typing",
  USER_STOPPED_TYPING: "user-stopped-typing",
  USER_ONLINE: "user-online",
  USER_OFFLINE: "user-offline",
  CONVERSATION_UPDATED: "conversation-updated",
} as const;

export default PusherClient;
