"use client"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllUsers, updateUserRole } from "@/lib/admin-actions"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { queryClient } from "@/lib/react-query-provider"
import { useState } from "react"
import { UserRestrictionDialog } from "./user-restriction-dialog"
import { useRouter } from "next/navigation"
import { Ban, Eye } from "lucide-react"

interface User {
  id: string
  name: string | null
  email: string | null
  username: string | null
  role: string
  isActive: boolean
  registrationFeePaid: boolean
  createdAt: string
}

export function AdminUsers() {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)
  const [isRestrictionDialogOpen, setIsRestrictionDialogOpen] = useState(false)

  // Fetch users with React Query
  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  })

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: string }) => updateUserRole(userId, newRole),
    onMutate: async ({ userId, newRole }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["users"] })

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<User[]>(["users"])

      // Optimistically update to the new value
      queryClient.setQueryData<User[]>(["users"], (old) =>
        (old || []).map((user) => (user.id === userId ? { ...user, role: newRole } : user)),
      )

      return { previousUsers }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers)
      }
      toast.error("Update failed", {
        description: "There was a problem updating the user role.",
      })
    },
    onSuccess: () => {
      toast.success("Role updated", {
        description: "User role has been updated successfully.",
      })
    },
    onSettled: () => {
      // Always refetch after error or success to make sure the server state is reflected
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, newRole })
  }

  const handleViewUser = (userId: string) => {
    router.push(`/admin/users/${userId}`)
  }

  const handleRestrictionApplied = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] })
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-destructive font-medium">Failed to load users</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })} className="mt-4">
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">User</TableHead>
              <TableHead className="w-1/5">Status</TableHead>
              <TableHead className="w-1/6">Role</TableHead>
              <TableHead className="w-1/6 hidden sm:table-cell">Joined</TableHead>
              <TableHead className="w-1/6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading state with skeleton rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-9 w-24" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium truncate">{user.name || user.username || "Anonymous"}</div>
                    <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{user.registrationFeePaid ? "Fee Paid" : "Fee Pending"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={updateRoleMutation.isPending && updateRoleMutation.variables?.userId === user.id}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatDistanceToNow(new Date(user.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewUser(user.id)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {user.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedUser({
                              id: user.id,
                              name: user.name || user.username || "Anonymous",
                            })
                            setIsRestrictionDialogOpen(true)
                          }}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Restrict
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <UserRestrictionDialog
          isOpen={isRestrictionDialogOpen}
          onClose={() => setIsRestrictionDialogOpen(false)}
          userId={selectedUser.id}
          userName={selectedUser.name}
          onRestrictionApplied={handleRestrictionApplied}
        />
      )}
    </div>
  )
}
