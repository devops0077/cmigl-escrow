"use client";

import type React from "react";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { Search, UserCog, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  role: string;
  createdAt: string;
}

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const queryClient = useQueryClient();

  // Debounce search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(e.target.value);
      setPage(1); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users", { page, pageSize, search: debouncedSearch }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await apiClient.get(`/admin/users?${params.toString()}`);
      return response.data;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      newRole,
    }: {
      userId: string;
      newRole: string;
    }) => {
      return apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated", {
        description: "User role has been updated successfully.",
      });
    },
    onError: () => {
      toast.error("Update failed", {
        description: "There was a problem updating the user role.",
      });
    },
  });

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    setIsUpdating(true);
    try {
      await updateRoleMutation.mutateAsync({ userId, newRole });
    } finally {
      setIsUpdating(false);
    }
  };

  // Mobile card view
  const renderMobileView = () => {
    if (!data?.data || data.data.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">No users found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 md:hidden">
        {data.data.map((user: User) => (
          <Card key={user.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between bg-muted/50 p-3 border-b">
                <div className="flex flex-col">
                  <span className="font-medium truncate max-w-[200px]">
                    {user.name || "N/A"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {user.email || "N/A"}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                      <UserCog className="mr-2 h-4 w-4" />
                      Manage User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Username</p>
                    <p className="truncate font-medium">
                      {user.username || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "outline"}
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Desktop table view
  const renderDesktopView = () => {
    return (
      <div className="rounded-md border hidden md:block">
        <div className="grid grid-cols-6 gap-4 p-4 text-sm font-medium">
          <div>Name</div>
          <div>Email</div>
          <div>Username</div>
          <div>Role</div>
          <div>Joined</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y">
          {data?.data.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            data?.data.map((user: User) => (
              <div key={user.id} className="grid grid-cols-6 gap-4 p-4 text-sm">
                <div className="truncate">{user.name || "N/A"}</div>
                <div className="truncate">{user.email || "N/A"}</div>
                <div className="truncate">{user.username || "N/A"}</div>
                <div>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "outline"}
                  >
                    {user.role}
                  </Badge>
                </div>
                <div>{formatDate(user.createdAt)}</div>
                <div className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(user)}
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Mobile skeletons */}
        <div className="md:hidden space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-md" />
          ))}
        </div>

        {/* Desktop skeletons */}
        <div className="hidden md:block">
          <div className="rounded-md border">
            <div className="grid grid-cols-6 gap-4 p-4 text-sm font-medium">
              <div>Name</div>
              <div>Email</div>
              <div>Username</div>
              <div>Role</div>
              <div>Joined</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {Array.from({ length: pageSize }).map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4 p-4 text-sm">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                  <div className="text-right">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center p-4">
        <p className="text-muted-foreground">Failed to load users</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search users..."
          className="w-full pl-8"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {renderMobileView()}
      {renderDesktopView()}

      {data && data.meta.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      {selectedUser && (
        <Dialog
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage User</DialogTitle>
              <DialogDescription>
                Update role and permissions for{" "}
                {selectedUser.name ||
                  selectedUser.username ||
                  selectedUser.email}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right">Current Role:</span>
                <Badge
                  className="col-span-3"
                  variant={
                    selectedUser.role === "ADMIN" ? "default" : "outline"
                  }
                >
                  {selectedUser.role}
                </Badge>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right">Change Role:</span>
                <div className="col-span-3 flex gap-2">
                  <Button
                    variant={
                      selectedUser.role === "USER" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleRoleUpdate(selectedUser.id, "USER")}
                    disabled={selectedUser.role === "USER" || isUpdating}
                  >
                    User
                  </Button>
                  <Button
                    variant={
                      selectedUser.role === "ADMIN" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleRoleUpdate(selectedUser.id, "ADMIN")}
                    disabled={selectedUser.role === "ADMIN" || isUpdating}
                  >
                    Admin
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
