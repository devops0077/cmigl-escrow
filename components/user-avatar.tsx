import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "next-auth";

interface UserAvatarProps {
  user: User | undefined;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  if (!user) {
    return (
      <Avatar className={className}>
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <Avatar className={className}>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
