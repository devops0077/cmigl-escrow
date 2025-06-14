"use client";

import { UserRestrictionsList } from "./user-restrictions-list";

interface UserRestrictionsSectionProps {
  userId: string;
}

export function UserRestrictionsSection({
  userId,
}: UserRestrictionsSectionProps) {
  return (
    <UserRestrictionsList
      userId={userId}
      onRestrictionRemoved={() => {
        // Handle restriction removal if needed
      }}
    />
  );
}
