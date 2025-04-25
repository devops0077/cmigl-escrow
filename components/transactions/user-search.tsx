"use client"

import { useState, useEffect, useRef } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { searchUsers } from "@/lib/data-actions"

interface User {
  id: string
  name: string | null
  username: string | null
  email: string | null
}

interface UserSearchProps {
  onSelect: (user: User) => void
}

export function UserSearch({ onSelect }: UserSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setUsers([])
      return
    }

    setLoading(true)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(query)
        setUsers(results)
      } catch (error) {
        console.error("Error searching users:", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  const handleSelect = (user: User) => {
    setSelectedUser(user)
    onSelect(user)
    setOpen(false)
  }

  return (
    <div className="relative">
      <div
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        onClick={() => setOpen(true)}
      >
        {selectedUser ? (
          <div className="flex items-center gap-2">
            <span>{selectedUser.name || selectedUser.username || selectedUser.email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Search for a user...</span>
        )}
      </div>
      {open && (
        <div className="absolute top-full z-10 w-full mt-1">
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search by name, username, or email..." value={query} onValueChange={setQuery} />
            <CommandList>
              {loading && <CommandEmpty>Searching...</CommandEmpty>}
              {!loading && query.length < 2 && <CommandEmpty>Type at least 2 characters to search</CommandEmpty>}
              {!loading && query.length >= 2 && users.length === 0 && <CommandEmpty>No users found</CommandEmpty>}
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem key={user.id} value={user.id} onSelect={() => handleSelect(user)}>
                    <div className="flex flex-col">
                      <span>{user.name || user.username}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
