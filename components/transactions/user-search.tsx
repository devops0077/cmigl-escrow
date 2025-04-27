"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
}

interface UserSearchProps {
  onSelect: (user: User | null) => void;
  selectedUser: string | null;
  placeholder?: string;
  label?: string;
  excludeCurrentUser?: boolean;
}

export function UserSearch({
  onSelect,
  selectedUser,
  placeholder = "Search users...",
  label = "Select user",
  excludeCurrentUser = false,
}: UserSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  // Debounce search input
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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

  const selectedUserData = React.useMemo(() => {
    if (!selectedUser) return null;
    return data?.data.find((user: User) => user.id === selectedUser) || null;
  }, [data, selectedUser]);

  const handleSelect = (user: User) => {
    onSelect(user);
    setOpen(false);
  };

  const clearSelection = () => {
    onSelect(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2 w-full">
        <PopoverTrigger asChild className="flex-1 w-full">
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedUser ? (
              <span className="truncate">
                {selectedUserData.name || selectedUserData.email}
              </span>
            ) : (
              <span className="text-muted-foreground">{label}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        {selectedUser && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSelection}
            className="h-9 w-9"
            type="button"
            aria-label="Clear selection"
            title="Clear selection"
            data-state={open ? "open" : "closed"}
            data-disabled={isLoading}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear selection</span>
          </Button>
        )}
      </div>

      <PopoverContent className="p-0 w-[300px]">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading && (
              <div className="p-2 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && debouncedQuery.length < 2 && (
              <CommandEmpty>Type at least 2 characters to search</CommandEmpty>
            )}

            {!isLoading &&
              debouncedQuery?.length >= 2 &&
              data?.data?.length === 0 && (
                <CommandEmpty>No users found</CommandEmpty>
              )}

            {!isLoading && data?.data.length > 0 && (
              <CommandGroup>
                {data.data.map((user: User) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => handleSelect(user)}
                    className="flex items-center"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUserData?.id === user.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
