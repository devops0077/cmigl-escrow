"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { getInitials } from "@/lib/utils";

interface MessageAttachment {
  id: string;
  url: string;
  filename: string;
  fileType: string;
}

interface Message {
  id: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  createdAt: string;
  readAt: string | null;
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
}

interface UserMessagesSectionProps {
  userId: string;
  userName: string;
}

export function UserMessagesSection({
  userId,
  userName,
}: UserMessagesSectionProps) {
  const [newMessage, setNewMessage] = useState("");
  const [priority, setPriority] = useState<
    "LOW" | "NORMAL" | "HIGH" | "URGENT"
  >("NORMAL");
  const [attachments, setAttachments] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages
  const {
    data: messagesData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-user-messages", userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/messages`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      priority: string;
      attachments?: string[];
    }) => {
      const response = await fetch(`/api/admin/users/${userId}/messages`, {
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
      setPriority("NORMAL");
      setAttachments([]);
      queryClient.invalidateQueries({
        queryKey: ["admin-user-messages", userId],
      });
    },
    onError: (error) => {
      toast.error("Failed to send message", {
        description: error.message,
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendMessageMutation.mutate({
      content: newMessage.trim(),
      priority,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
        return <AlertTriangle className="h-3 w-3" />;
      case "HIGH":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
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

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Direct Messages
        </CardTitle>
        <CardDescription>Communicate directly with {userName}</CardDescription>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Start a conversation with {userName}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message: Message) => {
                const isFromAdmin = message.sender.role === "ADMIN";
                const senderName =
                  message.sender.name ||
                  message.sender.username ||
                  message.sender.email;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isFromAdmin ? "justify-end" : "justify-start"}`}
                  >
                    {!isFromAdmin && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.sender.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(senderName || "U")}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[70%] ${isFromAdmin ? "order-first" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {isFromAdmin ? (
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {senderName} (Admin)
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {senderName}
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

                      <div
                        className={`rounded-lg p-3 ${isFromAdmin ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
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

                    {isFromAdmin && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.sender.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(senderName || "A")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Message Input */}
        <div className="p-4 space-y-3">
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
            <Select
              value={priority}
              onValueChange={(value: any) => setPriority(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1 relative">
              <Textarea
                placeholder={`Send a message to ${userName}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] pr-12 resize-none"
                disabled={sendMessageMutation.isPending}
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
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>{newMessage.length}/1000</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
