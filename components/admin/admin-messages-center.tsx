"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Search, AlertTriangle } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  role: string;
  restricted: boolean;
  isActive: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export function AdminMessagesCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const {
    data: conversationsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-conversations", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(
        `/api/admin/messages/conversations?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleConversationClick = (userId: string) => {
    router.push(`/admin/users/${userId}?tab=messages`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Center
          </CardTitle>
          <CardDescription>Manage conversations with users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-24" />
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
            Message Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Failed to load conversations</p>
            <p className="text-sm text-muted-foreground">
              Please try again later
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const conversations = conversationsData?.conversations || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Message Center
        </CardTitle>
        <CardDescription>Manage conversations with users</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Conversations List */}
        <ScrollArea className="h-[500px]">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No conversations found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "No users have started conversations yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation: Conversation) => {
                const displayName =
                  conversation.name ||
                  conversation.username ||
                  "Anonymous User";
                const hasUnread = conversation.unreadCount > 0;

                return (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      hasUnread ? "bg-blue-50 border-blue-200" : ""
                    }`}
                    onClick={() => handleConversationClick(conversation.id)}
                  >
                    <div className="flex gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.image || undefined} />
                          <AvatarFallback>
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        {hasUnread && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                            {conversation.unreadCount > 9
                              ? "9+"
                              : conversation.unreadCount}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-sm font-medium truncate ${hasUnread ? "font-semibold" : ""}`}
                            >
                              {displayName}
                            </h4>
                            <Badge
                              variant={
                                conversation.restricted
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {conversation.role}
                            </Badge>
                            {conversation.restricted && (
                              <AlertTriangle className="h-3 w-3 text-orange-600" />
                            )}
                            {!conversation.isActive && (
                              <div
                                className="h-2 w-2 bg-gray-400 rounded-full"
                                title="Inactive"
                              />
                            )}
                          </div>
                          {conversation.lastMessageAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(conversation.lastMessageAt),
                                { addSuffix: true }
                              )}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mb-1">
                          {conversation.email}
                        </p>

                        {conversation.lastMessage && (
                          <p
                            className={`text-sm text-muted-foreground truncate ${
                              hasUnread ? "font-medium text-foreground" : ""
                            }`}
                          >
                            {conversation.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
