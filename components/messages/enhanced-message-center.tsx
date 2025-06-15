"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import {
  MessageSquare,
  Send,
  Paperclip,
  Download,
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
  Search,
  Smile,
  Mic,
  ImageIcon,
  File,
  Filter,
  ArrowDown,
  Phone,
  Video,
  Settings,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import {
  pusherClient,
  getConversationChannel,
  PUSHER_EVENTS,
} from "@/lib/pusher-client";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

// Enhanced interfaces with new features
interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  createdAt: string;
}

interface EnhancedMessage {
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
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
    fileType: string;
  }>;
  reactions: MessageReaction[];
  isEdited?: boolean;
  editedAt?: string;
}

interface EnhancedMessageCenterProps {
  recipientId?: string;
  recipientName?: string;
  isAdminView?: boolean;
}

const EMOJI_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "😡"];

const MESSAGE_ANIMATIONS = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
  transition: { duration: 0.3, ease: "easeOut" },
};

const TYPING_ANIMATION = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { duration: 0.2 },
};

export function EnhancedMessageCenter({
  recipientId,
  recipientName,
  isAdminView = false,
}: EnhancedMessageCenterProps) {
  const { data: session } = useSession();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<EnhancedMessage | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);
  const queryClient = useQueryClient();
  const controls = useAnimation();

  const apiEndpoint =
    isAdminView && recipientId
      ? `/api/admin/users/${recipientId}/messages`
      : "/api/messages/admin";

  // Enhanced fetch messages with search
  const {
    data: messagesData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["enhanced-messages", recipientId, selectedThread, searchQuery],
    queryFn: async () => {
      const url = new URL(apiEndpoint, window.location.origin);
      if (selectedThread) {
        url.searchParams.set("threadId", selectedThread);
      }
      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    refetchInterval: 5000,
  });

  // Send message mutation with enhanced features
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      attachments?: string[];
      threadId?: string;
      replyToId?: string;
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
      // Smooth success animation
      controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.2 },
      });

      toast.success("Message sent", {
        description: "Your message has been delivered",
        duration: 2000,
      });

      setNewMessage("");
      setAttachments([]);
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["enhanced-messages"] });

      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    onError: (error) => {
      toast.error("Failed to send message", {
        description: error.message,
      });
    },
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async (data: { messageId: string; emoji: string }) => {
      const response = await fetch(
        `/api/messages/${data.messageId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji: data.emoji }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add reaction");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enhanced-messages"] });
    },
  });

  // Enhanced typing handler with debounce
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Send typing indicator
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Send stop typing indicator
    }, 3000);
  }, [isTyping]);

  // Enhanced Pusher setup
  useEffect(() => {
    if (!session?.user?.id) return;

    const currentUserId = session.user.id;
    const otherUserId = recipientId || "admin";
    const channel = pusherClient.subscribe(
      getConversationChannel(currentUserId, otherUserId)
    );

    // Connection status with animations
    pusherClient.connection.bind("connected", () => {
      setIsConnected(true);
      controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.3 },
      });
    });

    pusherClient.connection.bind("disconnected", () => {
      setIsConnected(false);
    });

    // Enhanced message events
    channel.bind(PUSHER_EVENTS.NEW_MESSAGE, (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["enhanced-messages"] });

      if (data.senderId !== currentUserId) {
        // Animate new message arrival
        controls.start({
          y: [10, 0],
          opacity: [0, 1],
          transition: { duration: 0.4, ease: "easeOut" },
        });

        toast.success("New message", {
          description: "You have a new message",
          duration: 3000,
        });
      }
    });

    // Typing events with smooth animations
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
  }, [session?.user?.id, recipientId, queryClient, controls]);

  // Enhanced auto-scroll with smooth behavior
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messagesData?.messages]);

  // Scroll detection for "scroll to bottom" button
  const handleScroll = useCallback((event: any) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
  }, []);

  // Enhanced message sending
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || sendMessageMutation.isPending) return;

    const messageData: any = {
      content: newMessage.trim(),
    };

    if (attachments.length > 0) {
      messageData.attachments = attachments;
    }

    if (replyingTo?.threadId) {
      messageData.threadId = replyingTo.threadId;
    } else if (replyingTo) {
      messageData.replyToId = replyingTo.id;
    }

    sendMessageMutation.mutate(messageData);
  }, [newMessage, attachments, replyingTo, sendMessageMutation]);

  // Enhanced keyboard handling
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      } else if (e.key === "Escape") {
        setReplyingTo(null);
        setShowSearch(false);
      } else {
        handleTyping();
      }
    },
    [handleSendMessage, handleTyping]
  );

  // Utility functions
  const getPriorityGradient = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "from-red-500 to-red-600";
      case "HIGH":
        return "from-orange-500 to-orange-600";
      case "NORMAL":
        return "from-blue-500 to-blue-600";
      case "LOW":
        return "from-gray-500 to-gray-600";
      default:
        return "from-blue-500 to-blue-600";
    }
  };

  const getMessageDate = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, "HH:mm");
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, "HH:mm")}`;
    } else {
      return format(messageDate, "MMM dd, HH:mm");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="h-[700px] border-0 shadow-xl ">
          <CardHeader className="border-b backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className="flex gap-4"
                >
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-6">
              We couldn't load your messages. Please try again.
            </p>
            <Button
              onClick={() => refetch()}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const messages = messagesData?.messages || [];
  const filteredMessages = searchQuery
    ? messages.filter((msg: EnhancedMessage) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <Card className="h-[700px] border-0 shadow-2xl  overflow-hidden">
        {/* Enhanced Header */}
        <CardHeader className="border-b  backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar className="h-12 w-12 ring-2 ">
                  <AvatarImage
                    src={recipientName ? undefined : "/admin-avatar.png"}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                    {isAdminView ? getInitials(recipientName || "U") : "ST"}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              <div>
                <CardTitle className="flex items-center gap-3 md:text-lg">
                  {isAdminView ? `${recipientName}` : "Support Team"}
                  <motion.div
                    animate={controls}
                    className="flex items-center gap-1"
                  >
                    {isConnected ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 text-green-600"
                      >
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <Wifi className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 text-red-500"
                      >
                        <div className="h-2 w-2 bg-red-500 rounded-full" />
                        <WifiOff className="h-4 w-4" />
                      </motion.div>
                    )}
                  </motion.div>
                </CardTitle>

                <CardDescription className="flex items-center gap-2">
                  <AnimatePresence>
                    {otherUserTyping ? (
                      <motion.div
                        {...TYPING_ANIMATION}
                        className="flex items-center gap-1 text-blue-600"
                      >
                        <div className="flex space-x-1">
                          <motion.div
                            className="w-1 h-1 bg-blue-500 rounded-full"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{
                              repeat: Number.POSITIVE_INFINITY,
                              duration: 1,
                              delay: 0,
                            }}
                          />
                          <motion.div
                            className="w-1 h-1 bg-blue-500 rounded-full"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{
                              repeat: Number.POSITIVE_INFINITY,
                              duration: 1,
                              delay: 0.2,
                            }}
                          />
                          <motion.div
                            className="w-1 h-1 bg-blue-500 rounded-full"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{
                              repeat: Number.POSITIVE_INFINITY,
                              duration: 1,
                              delay: 0.4,
                            }}
                          />
                        </div>
                        <span className="text-sm">typing...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1"
                      >
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                        <span className="text-sm">Online</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardDescription>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(!showSearch)}
                  className={cn(
                    "h-9 w-9 p-0 rounded-full",
                    showSearch && "bg-blue-100 text-blue-600"
                  )}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </motion.div>

              {/* <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-full"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-full"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </motion.div> */}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-full"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Filter className="h-4 w-4 mr-2" />
                    Filter Messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <X className="h-4 w-4 mr-2" />
                    Clear Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-50 border-0 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        {/* Reply Banner */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-green-50 border-b px-4 py-3 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-green-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Replying to {replyingTo.sender.name || "User"}
                    </p>
                    <p className="text-sm text-green-700 truncate max-w-md">
                      {replyingTo.content}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyingTo(null)}
                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <CardContent className="flex-1 p-0 relative overflow-hidden">
          <ScrollArea
            className="h-[450px] px-4 py-6"
            onScrollCapture={handleScroll}
            ref={scrollAreaRef}
          >
            {filteredMessages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {isAdminView
                    ? `Start a conversation with ${recipientName}`
                    : "Send a message to get help from our support team"}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6 px-1">
                <AnimatePresence>
                  {filteredMessages.map(
                    (message: EnhancedMessage, index: number) => {
                      const isFromCurrentUser =
                        message.sender.id === session?.user?.id;
                      const senderName =
                        message.sender.name ||
                        message.sender.username ||
                        message.sender.email;
                      const showAvatar =
                        index === 0 ||
                        filteredMessages[index - 1]?.sender.id !==
                          message.sender.id;

                      return (
                        <motion.div
                          key={message.id}
                          {...MESSAGE_ANIMATIONS}
                          layout
                          className={cn(
                            "flex gap-3 group",
                            isFromCurrentUser ? "justify-end" : "justify-start"
                          )}
                        >
                          {/* Avatar for other users */}
                          {!isFromCurrentUser && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 }}
                              className="flex-shrink-0"
                            >
                              {showAvatar ? (
                                <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                                  <AvatarImage
                                    src={message.sender.image || undefined}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-xs">
                                    {getInitials(senderName || "U")}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-8 w-8" />
                              )}
                            </motion.div>
                          )}

                          {/* Message Content */}
                          <div
                            className={cn(
                              "max-w-[75%] space-y-1",
                              isFromCurrentUser && "order-first"
                            )}
                          >
                            {/* Sender info and timestamp */}
                            {showAvatar && (
                              <div
                                className={cn(
                                  "flex items-center gap-2 px-1",
                                  isFromCurrentUser
                                    ? "justify-end"
                                    : "justify-start"
                                )}
                              >
                                <span className="text-xs font-medium text-gray-600">
                                  {message.sender.role === "ADMIN" ? (
                                    <div className="flex items-center gap-1">
                                      <Shield className="h-3 w-3 text-blue-600" />
                                      {isAdminView ? "You" : "Support Team"}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3 text-gray-500" />
                                      {isFromCurrentUser ? "You" : senderName}
                                    </div>
                                  )}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {getMessageDate(message.createdAt)}
                                </span>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className="relative"
                            >
                              <div
                                className={cn(
                                  "rounded-2xl px-4 py-3 shadow-sm relative overflow-hidden",
                                  isFromCurrentUser
                                    ? "bg-gradient-to-br from-green-500 to-green-600 text-white ml-auto"
                                    : "bg-zinc-900 border border-gray-100 text-white"
                                )}
                              >
                                {/* Priority indicator */}
                                {message.priority !== "NORMAL" && (
                                  <div
                                    className={cn(
                                      "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
                                      getPriorityGradient(message.priority)
                                    )}
                                  />
                                )}

                                {/* Message content */}
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {message.content}
                                </p>

                                {/* Attachments */}
                                {message.attachments.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {message.attachments.map((attachment) => (
                                      <motion.div
                                        key={attachment.id}
                                        whileHover={{ scale: 1.02 }}
                                        className={cn(
                                          "flex items-center gap-2 p-2 rounded-lg border",
                                          isFromCurrentUser
                                            ? "bg-white/10 border-white/20"
                                            : "bg-gray-50 border-gray-200"
                                        )}
                                      >
                                        <File className="h-4 w-4" />
                                        <span className="text-xs flex-1 truncate">
                                          {attachment.filename}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0"
                                          onClick={() =>
                                            window.open(
                                              attachment.url,
                                              "_blank"
                                            )
                                          }
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      </motion.div>
                                    ))}
                                  </div>
                                )}

                                {/* Message status */}
                                <div
                                  className={cn(
                                    "flex items-center justify-end gap-1 mt-2",
                                    isFromCurrentUser
                                      ? "text-white/70"
                                      : "text-gray-400"
                                  )}
                                >
                                  <span className="text-xs">
                                    {format(
                                      new Date(message.createdAt),
                                      "HH:mm"
                                    )}
                                  </span>
                                  {isFromCurrentUser && (
                                    <>
                                      {message.readAt ? (
                                        <CheckCircle2 className="h-3 w-3 text-green-300" />
                                      ) : (
                                        <Clock className="h-3 w-3" />
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Message Actions */}
                              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1">
                                  {/* Reaction Button */}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 bg-blue-500 hover:bg-white shadow-sm"
                                      >
                                        <Smile className="h-3 w-3" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-auto p-2"
                                      align="end"
                                    >
                                      <div className="flex gap-1">
                                        {EMOJI_REACTIONS.map((emoji) => (
                                          <Button
                                            key={emoji}
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 hover:bg-gray-100"
                                            onClick={() =>
                                              addReactionMutation.mutate({
                                                messageId: message.id,
                                                emoji,
                                              })
                                            }
                                          >
                                            {emoji}
                                          </Button>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>

                                  {/* More Actions */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 bg-blue-500  shadow-sm"
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
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
                                          toast.success("Copied to clipboard");
                                        }}
                                      >
                                        <Forward className="h-4 w-4 mr-2" />
                                        Copy
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              {/* Reactions */}
                              {message.reactions &&
                                message.reactions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {message.reactions.map((reaction) => (
                                      <motion.div
                                        key={reaction.id}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        whileHover={{ scale: 1.1 }}
                                        className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs"
                                      >
                                        <span>{reaction.emoji}</span>
                                        <span className="text-gray-600">1</span>
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                            </motion.div>
                          </div>

                          {/* Avatar for current user */}
                          {isFromCurrentUser && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 }}
                              className="flex-shrink-0"
                            >
                              {showAvatar ? (
                                <Avatar className="h-8 w-8 ring-2 ring-green-100 shadow-sm">
                                  <AvatarImage
                                    src={message.sender.image || undefined}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xs">
                                    {getInitials(senderName || "U")}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-8 w-8" />
                              )}
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    }
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Scroll to Bottom Button */}
          <AnimatePresence>
            {showScrollToBottom && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="absolute bottom-4 right-4"
              >
                <Button
                  size="sm"
                  onClick={scrollToBottom}
                  className="h-10 w-10 p-0 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {/* Enhanced Message Input */}
        <div className="border-t  backdrop-blur-sm p-4 space-y-3">
          {/* Attachments Preview */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
                  {attachments.map((attachment, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2 bg-white p-2 rounded border text-sm"
                    >
                      <File className="h-4 w-4 text-gray-500" />
                      <span className="truncate max-w-32">
                        {attachment.split("/").pop()}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 text-gray-400 hover:text-red-500"
                        onClick={() =>
                          setAttachments(
                            attachments.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="flex items-end gap-3">
            {/* Attachment Button */}
            {/* <div className="flex gap-1">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
                >
                  <Paperclip className="h-4 w-4 text-gray-500" />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
                >
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                </Button>
              </motion.div>
            </div> */}

            {/* Message Input */}
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                className="min-h-[48px] max-h-32 resize-none border-0 bg-gray-50 focus:bg-white transition-colors rounded-2xl pr-12"
                disabled={sendMessageMutation.isPending}
                maxLength={1000}
              />

              {/* Character Counter */}
              <div className="absolute bottom-2 right-12 text-xs text-gray-400">
                {newMessage.length}/1000
              </div>
            </div>

            {/* Voice Message Button */}
            {/* <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "h-10 w-10 p-0 rounded-full transition-colors",
                  isRecording ? "bg-red-100 text-red-600" : "hover:bg-gray-100"
                )}
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => setIsRecording(false)}
                onMouseLeave={() => setIsRecording(false)}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </motion.div> */}

            {/* Send Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={controls}
            >
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className={cn(
                  "h-10 w-10 p-0 rounded-full transition-all duration-200",
                  newMessage.trim()
                    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
                    : "bg-gray-200 text-gray-400"
                )}
              >
                {sendMessageMutation.isPending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    <Clock className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          </div>

          {/* Input Helper Text */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>Press Enter to send, Shift+Enter for new line</span>
              {!isConnected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 text-red-500"
                >
                  <WifiOff className="h-3 w-3" />
                  <span>Reconnecting...</span>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 text-blue-500"
                >
                  <div className="flex space-x-1">
                    <motion.div
                      className="w-1 h-1 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 1,
                        delay: 0,
                      }}
                    />
                    <motion.div
                      className="w-1 h-1 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 1,
                        delay: 0.2,
                      }}
                    />
                    <motion.div
                      className="w-1 h-1 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 1,
                        delay: 0.4,
                      }}
                    />
                  </div>
                  <span>Sending typing indicator...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
