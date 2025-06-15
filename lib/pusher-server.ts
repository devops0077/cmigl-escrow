import Pusher from "pusher";

if (
  !process.env.PUSHER_APP_ID ||
  !process.env.PUSHER_KEY ||
  !process.env.PUSHER_SECRET ||
  !process.env.PUSHER_CLUSTER
) {
  throw new Error("Missing Pusher environment variables");
}

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Channel naming conventions
export const getConversationChannel = (userId1: string, userId2: string) => {
  // Sort IDs to ensure consistent channel names regardless of who initiates
  const sortedIds = [userId1, userId2].sort();
  return `conversation-${sortedIds[0]}-${sortedIds[1]}`;
};

export const getUserPresenceChannel = (userId: string) => {
  return `presence-user-${userId}`;
};

export const getAdminPresenceChannel = () => {
  return "presence-admins";
};

// Event types
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

// Pusher trigger helpers
export const triggerNewMessage = async (
  senderId: string,
  recipientId: string,
  message: any
) => {
  const channel = getConversationChannel(senderId, recipientId);
  await pusherServer.trigger(channel, PUSHER_EVENTS.NEW_MESSAGE, {
    message,
    senderId,
    recipientId,
    timestamp: new Date().toISOString(),
  });
};

export const triggerMessageRead = async (
  senderId: string,
  recipientId: string,
  messageId: string
) => {
  const channel = getConversationChannel(senderId, recipientId);
  await pusherServer.trigger(channel, PUSHER_EVENTS.MESSAGE_READ, {
    messageId,
    readBy: recipientId,
    readAt: new Date().toISOString(),
  });
};

export const triggerUserTyping = async (
  senderId: string,
  recipientId: string,
  isTyping: boolean
) => {
  const channel = getConversationChannel(senderId, recipientId);
  const event = isTyping
    ? PUSHER_EVENTS.USER_TYPING
    : PUSHER_EVENTS.USER_STOPPED_TYPING;
  await pusherServer.trigger(channel, event, {
    userId: senderId,
    timestamp: new Date().toISOString(),
  });
};

export const triggerUserPresence = async (
  userId: string,
  isOnline: boolean
) => {
  const channel = getUserPresenceChannel(userId);
  const event = isOnline
    ? PUSHER_EVENTS.USER_ONLINE
    : PUSHER_EVENTS.USER_OFFLINE;
  await pusherServer.trigger(channel, event, {
    userId,
    isOnline,
    timestamp: new Date().toISOString(),
  });
};
