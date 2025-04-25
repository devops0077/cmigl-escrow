"use client";

import { useState, useEffect } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { getAllUsers, updateUserRole } from "@/lib/admin-actions";
import { Search, UserCog } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  role: string;
  createdAt: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    setIsUpdating(true);
    try {
      await updateUserRole(userId, newRole);

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      toast.success("Role updated", {
        description: "User role has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Update failed", {
        description: "There was a problem updating the user role.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    return (
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false
    );
  });

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading users...</div>;
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-muted-foreground">No users found</p>
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
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
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
          {filteredUsers.map((user) => (
            <div key={user.id} className="grid grid-cols-6 gap-4 p-4 text-sm">
              <div className="truncate">{user.name || "N/A"}</div>
              <div className="truncate">{user.email || "N/A"}</div>
              <div className="truncate">{user.username || "N/A"}</div>
              <div>
                <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                  {user.role}
                </Badge>
              </div>
              <div>{formatDate(user.createdAt)}</div>
              <div className="text-right">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </DialogTrigger>
                  {selectedUser && (
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
                              selectedUser.role === "ADMIN"
                                ? "default"
                                : "outline"
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
                                selectedUser.role === "USER"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                handleRoleUpdate(selectedUser.id, "USER")
                              }
                              disabled={
                                selectedUser.role === "USER" || isUpdating
                              }
                            >
                              User
                            </Button>
                            <Button
                              variant={
                                selectedUser.role === "ADMIN"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                handleRoleUpdate(selectedUser.id, "ADMIN")
                              }
                              disabled={
                                selectedUser.role === "ADMIN" || isUpdating
                              }
                            >
                              Admin
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedUser(null)}
                        >
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
