"use client";

import * as React from "react";
import { Search, X, User, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useDebounce } from "@/hooks/use-debounce";

interface UserType {
  id: string;
  name: string;
  email: string;
  username?: string;
  passportImage?: string;
  isActive?: boolean;
}

interface UserSearchProps {
  onSelect: (user: UserType | null) => void;
  selectedUser: string | null;
  placeholder?: string;
  excludeCurrentUser?: boolean;
}

export function UserSearch({
  onSelect,
  selectedUser,
  placeholder = "Search for users by name or email...",
  excludeCurrentUser = false,
}: UserSearchProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedUserData, setSelectedUserData] =
    React.useState<UserType | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["users-search", debouncedQuery, excludeCurrentUser],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return { data: [] };

      const params = new URLSearchParams();
      params.append("query", debouncedQuery);
      if (excludeCurrentUser) params.append("excludeCurrentUser", "true");

      const response = await apiClient.get(
        `/users/search?${params.toString()}`
      );
      return response.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Update selected user data when selectedUser changes
  React.useEffect(() => {
    if (selectedUser && data?.data) {
      const user = data.data.find((u: UserType) => u.id === selectedUser);
      if (user) {
        setSelectedUserData(user);
      }
    } else if (!selectedUser) {
      setSelectedUserData(null);
    }
  }, [selectedUser, data]);

  const handleSelect = (user: UserType) => {
    onSelect(user);
    setSelectedUserData(user);
    setIsOpen(false);
    setSearchQuery("");
  };

  const clearSelection = () => {
    onSelect(null);
    setSelectedUserData(null);
    setSearchQuery("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3">
      {/* Selected User Display */}
      {selectedUserData && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={selectedUserData.passportImage || "/placeholder.svg"}
                    alt={selectedUserData.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(selectedUserData.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {selectedUserData.name}
                    </p>
                    {selectedUserData.isActive && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedUserData.email}
                  </p>
                  {selectedUserData.username && (
                    <p className="text-xs text-muted-foreground">
                      @{selectedUserData.username}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove selection</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results */}
      {isOpen && searchQuery.length >= 2 && (
        <Card className="border shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 animate-pulse"
                  >
                    <div className="h-10 w-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="p-6 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No users found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching with a different name or email
                </p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {data?.data?.map((user: UserType, index: number) => (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer z-20 transition-colors",
                      index !== data.data.length - 1 && "border-b"
                    )}
                    onClick={() => handleSelect(user)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.passportImage || "/placeholder.svg"}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-muted">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name}
                        </p>
                        {user.isActive && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0.5"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.username && (
                        <p className="text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Instructions */}
      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <p className="text-xs text-muted-foreground">
          Type at least 2 characters to search for users
        </p>
      )}

      {/* Click outside to close */}
      {/* {isOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
      )} */}
    </div>
  );
}
