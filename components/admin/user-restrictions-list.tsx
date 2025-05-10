"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { AlertTriangle, CheckCircle, Clock, User } from "lucide-react";
import { UserRestriction } from "@/lib/generated/prisma";

interface UserRestrictionsListProps {
  userId: string;
  onRestrictionRemoved: () => void;
}

export function UserRestrictionsList({
  userId,
  onRestrictionRemoved,
}: UserRestrictionsListProps) {
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchRestrictions();
  }, [userId]);

  const fetchRestrictions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/restrictions?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch restrictions");
      }

      const data = await response.json();
      setRestrictions(data.restrictions || []);
    } catch (error) {
      console.error("Error fetching restrictions:", error);
      toast.error("Failed to load user restrictions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRestriction = async (restrictionId: string) => {
    setIsRemoving(restrictionId);
    try {
      const response = await fetch(
        `/api/admin/users/restrictions?id=${restrictionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove restriction");
      }

      toast.success("Restriction removed successfully");
      onRestrictionRemoved();

      // Update the local state
      setRestrictions((prev) =>
        prev.map((r) =>
          r.id === restrictionId
            ? { ...r, active: false, resolvedAt: new Date() }
            : r
        )
      );
    } catch (error) {
      console.error("Error removing restriction:", error);
      toast.error("Failed to remove restriction");
    } finally {
      setIsRemoving(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Restrictions</CardTitle>
          <CardDescription>Loading user restrictions...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (restrictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Restrictions</CardTitle>
          <CardDescription>
            This user has no restriction history
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Account Restrictions
        </CardTitle>
        <CardDescription>
          {restrictions.some((r) => r.active)
            ? "This user currently has active restrictions"
            : "This user has previous restrictions but none are currently active"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {restrictions.map((restriction) => (
            <div
              key={restriction.id}
              className={`rounded-lg border p-4 ${
                restriction.active
                  ? "border-red-500 bg-red-500/20"
                  : "border-green-500 bg-green-500/20"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {restriction.active ? (
                    <Badge variant="destructive">Active</Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800"
                    >
                      Resolved
                    </Badge>
                  )}
                  <span className="font-medium">
                    {restriction.reason.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatDistanceToNow(new Date(restriction.appliedAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>

              {restriction.details && (
                <p className="mt-2 text-sm">{restriction.details}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>Applied by: {restriction.appliedById}</span>
                </div>

                <div>
                  Applied: {format(new Date(restriction.appliedAt), "PPP")}
                </div>

                {restriction.resolvedAt && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>
                      Resolved:{" "}
                      {format(new Date(restriction.resolvedAt), "PPP")}
                    </span>
                  </div>
                )}
              </div>

              {restriction.appealSubmitted && (
                <div className="mt-3 rounded border border-blue-500 bg-blue-800/30 p-3 text-sm">
                  <p className="font-medium text-blue-50">Appeal Submitted</p>
                  {restriction.appealText && (
                    <p className="mt-1 text-blue-100">
                      {restriction.appealText}
                    </p>
                  )}
                  {restriction.appealDate && (
                    <p className="mt-1 text-xs text-blue-100">
                      {formatDistanceToNow(new Date(restriction.appealDate), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
              )}

              {restriction.active && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveRestriction(restriction.id)}
                    disabled={!!isRemoving}
                    className="text-green-600 hover:bg-green-50 hover:text-green-700"
                  >
                    {isRemoving === restriction.id
                      ? "Removing..."
                      : "Remove Restriction"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
