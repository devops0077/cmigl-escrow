"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Send,
  Paperclip,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle2,
  User,
  Shield,
  X,
  Wifi,
  WifiOff,
  MoreVertical,
  Reply,
  Forward,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import {
  pusherClient,
  getConversationChannel,
  PUSHER_EVENTS,
} from "@/lib/pusher-client";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageAttachment {
  id: string;
  url: string;
  filename: string;
  fileType: string;
}

interface MessageThread {
  id: string;
  subject: string;
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }>;
}

interface Message {
  id: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  createdAt: string;
  readAt: string | null;
  threadId: string | null;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
    username: string | null;
    role: string;
    image: string | null;
  };
  recipient: {
    id: string;
    name: string | null;
    email: string | null;
    username: string | null;
    role: string;
    image: string | null;
  };
  attachments: MessageAttachment[];
  thread?: MessageThread;
}

interface UserPresence {
  isOnline: boolean;
  lastSeen: string;
}

interface AdminPresence {
  user: {
    id: string;
    name: string | null;
    role: string;
  };
  isOnline: boolean;
  lastSeen: string;
}

interface RealTimeMessageCenterProps {
  recipientId?: string;
  recipientName?: string;
  isAdminView?: boolean;
}

export function RealTimeMessageCenter({
  recipientId,
  recipientName,
  isAdminView = false,
}: RealTimeMessageCenterProps) {
  const { data: session } = authClient.useSession();
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);
  const queryClient = useQueryClient();

  const apiEndpoint =
    isAdminView && recipientId
      ? `/api/admin/users/${recipientId}/messages`
      : "/api/messages/admin";

  // Fetch messages with real-time updates
  const {
    data: messagesData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["real-time-messages", recipientId, selectedThread],
    queryFn: async () => {
      const url = new URL(apiEndpoint, window.location.origin);
      if (selectedThread) {
        url.searchParams.set("threadId", selectedThread);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    refetchInterval: 5000, // Fallback polling
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      attachments?: string[];
      threadId?: string;
    }) => {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Message sent successfully");
      setNewMessage("");
      setAttachments([]);
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["real-time-messages"] });
    },
    onError: (error) => {
      toast.error("Failed to send message", {
        description: error.message,
      });
    },
  });

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    async (typing: boolean) => {
      if (!session?.user?.id || !recipientId) return;

      try {
        await fetch("/api/pusher/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId,
            isTyping: typing,
          }),
        });
      } catch (error) {
        console.error("Failed to send typing indicator:", error);
      }
    },
    [session?.user?.id, recipientId]
  );

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 3000);
  }, [isTyping, sendTypingIndicator]);

  // Setup Pusher connection
  useEffect(() => {
    if (!session?.user?.id) return;

    const currentUserId = session.user.id;
    const otherUserId = recipientId || "admin";
    const channel = pusherClient.subscribe(
      getConversationChannel(currentUserId, otherUserId)
    );

    // Connection status
    pusherClient.connection.bind("connected", () => {
      setIsConnected(true);
    });

    pusherClient.connection.bind("disconnected", () => {
      setIsConnected(false);
    });

    // Message events
    channel.bind(PUSHER_EVENTS.NEW_MESSAGE, (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["real-time-messages"] });

      // Show notification if message is not from current user
      if (data.senderId !== currentUserId) {
        toast.success("New message received");
      }
    });

    channel.bind(PUSHER_EVENTS.MESSAGE_READ, (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["real-time-messages"] });
    });

    // Typing events
    channel.bind(PUSHER_EVENTS.USER_TYPING, (data: any) => {
      if (data.userId !== currentUserId) {
        setOtherUserTyping(true);
      }
    });

    channel.bind(PUSHER_EVENTS.USER_STOPPED_TYPING, (data: any) => {
      if (data.userId !== currentUserId) {
        setOtherUserTyping(false);
      }
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(
        getConversationChannel(currentUserId, otherUserId)
      );
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [session?.user?.id, recipientId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  // Update user presence
  useEffect(() => {
    const updatePresence = async (isOnline: boolean) => {
      try {
        await fetch("/api/pusher/user-presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnline }),
        });
      } catch (error) {
        console.error("Failed to update presence:", error);
      }
    };

    // Set online when component mounts
    updatePresence(true);

    // Set offline when page unloads
    const handleBeforeUnload = () => updatePresence(false);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Set offline when tab becomes hidden
    const handleVisibilityChange = () => {
      updatePresence(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      updatePresence(false);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData: any = {
      content: newMessage.trim(),
    };

    if (attachments.length > 0) {
      messageData.attachments = attachments;
    }

    if (replyingTo?.threadId) {
      messageData.threadId = replyingTo.threadId;
    } else if (replyingTo) {
      messageData.content = `Re: ${replyingTo.content.substring(0, 50)}...\n\n${messageData.content}`;
    }

    sendMessageMutation.mutate(messageData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "NORMAL":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "LOW":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "URGENT":
      case "HIGH":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getPresenceStatus = () => {
    if (isAdminView) {
      return messagesData?.userPresence;
    } else {
      const onlineAdmins =
        messagesData?.adminPresence?.filter(
          (admin: AdminPresence) => admin.isOnline
        ) || [];
      return onlineAdmins.length > 0 ? { isOnline: true } : { isOnline: false };
    }
  };

  if (isLoading) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Failed to load messages</p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const messages = messagesData?.messages || [];
  const presenceStatus = getPresenceStatus();

  return (
    <Card className=" flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {isAdminView
                ? `Messages with ${recipientName}`
                : "Support Messages"}
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {presenceStatus?.isOnline ? (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span>Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full" />
                  <span>Offline</span>
                </div>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="h-4 w-4" />
              <span className="text-sm">
                Replying to: {replyingTo.content.substring(0, 50)}...
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <CardContent className=" flex flex-col p-0">
        <ScrollArea className="flex-1 h-[400px] p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                {isAdminView
                  ? `Start a conversation with ${recipientName}`
                  : "Send a message to get help from our support team"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message: Message) => {
                const isFromCurrentUser =
                  message.sender.id === session?.user?.id;
                const senderName =
                  message.sender.name ||
                  message.sender.username ||
                  message.sender.email;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isFromCurrentUser && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.sender.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(senderName || "U")}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[70%] ${isFromCurrentUser ? "order-first" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {message.sender.role === "ADMIN" ? (
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {isAdminView ? "You" : "Support Team"}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {isFromCurrentUser ? "You" : senderName}
                            </div>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {message.priority !== "NORMAL" && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(message.priority)}`}
                          >
                            {getPriorityIcon(message.priority)}
                            {message.priority}
                          </Badge>
                        )}
                      </div>

                      <div className="relative group">
                        <div
                          className={`rounded-lg p-3 ${
                            isFromCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {/* Thread indicator */}
                          {message.thread && (
                            <div className="mb-2 p-2 bg-background/10 rounded border text-xs">
                              <div className="font-medium">
                                Thread: {message.thread.subject}
                              </div>
                              {message.thread.messages.length > 0 && (
                                <div className="mt-1 text-xs opacity-75">
                                  {message.thread.messages.length} previous
                                  messages
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>

                          {message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-2 p-2 bg-background/10 rounded border"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  <span className="text-xs flex-1 truncate">
                                    {attachment.filename}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() =>
                                      window.open(attachment.url, "_blank")
                                    }
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Message actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => setReplyingTo(message)}
                              >
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    message.content
                                  );
                                  toast.success("Message copied to clipboard");
                                }}
                              >
                                <Forward className="h-4 w-4 mr-2" />
                                Copy
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), "MMM dd, HH:mm")}
                        </span>
                        {message.readAt ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600">Read</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Sent
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isFromCurrentUser && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.sender.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(senderName || "U")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {isAdminView ? getInitials(recipientName || "U") : "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Message Input */}
        <div className="p-4 space-y-3 sticky bottom-0 bg-accent">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted p-2 rounded text-sm"
                >
                  <Paperclip className="h-3 w-3" />
                  <span className="truncate max-w-32">
                    {attachment.split("/").pop()}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0"
                    onClick={() =>
                      setAttachments(attachments.filter((_, i) => i !== index))
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                placeholder={`Type your message...`}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] pr-12 resize-none"
                disabled={sendMessageMutation.isPending}
                maxLength={1000}
              />
              <Button
                size="sm"
                className="absolute bottom-2 right-2 h-8 w-8 p-0"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Press Enter to send, Shift+Enter for new line</span>
              {!isConnected && (
                <Badge variant="destructive" className="text-xs">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
            <span>{newMessage.length}/1000</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

