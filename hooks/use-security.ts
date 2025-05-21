"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { SecurityEventPayload } from "@/types/security-types";

// Define types for security-related data
export type SecurityEvent = {
  id: string;
  userId: string;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  location?: string;
  metadata?: any;
  successful: boolean;
  sessionId?: string;
  createdAt: Date;
};

export type ActiveSession = {
  id: string;
  userAgent: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
};

/**
 * Hook for managing security-related functionality
 */
export function useSecurity() {
  const { data: session } = useSession();
  const [securityLog, setSecurityLog] = useState<SecurityEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState({
    securityLog: false,
    activeSessions: false,
    terminateSession: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    eventType: "",
    startDate: "",
    endDate: "",
    successful: "",
  });

  // Fetch security log and active sessions when session changes
  useEffect(() => {
    if (session?.user) {
      fetchSecurityLog();
      fetchActiveSessions();
    }
  }, [session, pagination.page, pagination.limit, filters]);

  // Fetch security log
  const fetchSecurityLog = async () => {
    try {
      setLoading((prev) => ({ ...prev, securityLog: true }));

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.eventType) queryParams.append("eventType", filters.eventType);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.successful)
        queryParams.append("successful", filters.successful);

      const response = await fetch(
        `/api/user/security-log?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch security log");
      }

      const data = await response.json();
      setSecurityLog(data.data);
      setPagination((prev) => ({
        ...prev,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching security log:", err);
    } finally {
      setLoading((prev) => ({ ...prev, securityLog: false }));
    }
  };

  // Update filters
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  // Fetch active sessions
  const fetchActiveSessions = async () => {
    try {
      setLoading((prev) => ({ ...prev, activeSessions: true }));
      const response = await fetch("/api/user/active-sessions");

      if (!response.ok) {
        throw new Error("Failed to fetch active sessions");
      }

      const data = await response.json();
      setActiveSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching active sessions:", err);
    } finally {
      setLoading((prev) => ({ ...prev, activeSessions: false }));
    }
  };

  // Terminate a specific session
  const terminateSession = async (sessionId: string) => {
    try {
      setLoading((prev) => ({ ...prev, terminateSession: true }));
      const response = await fetch("/api/user/active-sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to terminate session");
      }

      // Update the sessions list
      setActiveSessions((prev) =>
        prev.filter((session) => session.id !== sessionId)
      );

      toast.success("Session terminated", {
        description: "The session has been terminated successfully.",
      });

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error terminating session:", err);

      toast.error("Termination failed", {
        description:
          "There was a problem terminating the session. Please try again.",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading((prev) => ({ ...prev, terminateSession: false }));
    }
  };

  // Terminate all sessions except the current one
  const terminateAllSessions = async () => {
    try {
      setLoading((prev) => ({ ...prev, terminateSession: true }));
      const response = await fetch("/api/user/active-sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ allExceptCurrent: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to terminate all sessions");
      }

      // Update the sessions list to only include the current session
      setActiveSessions((prev) => prev.filter((session) => session.isCurrent));

      toast.success("All sessions terminated", {
        description: "All other sessions have been terminated successfully.",
      });

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error terminating all sessions:", err);

      toast.error("Termination failed", {
        description:
          "There was a problem terminating all sessions. Please try again.",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading((prev) => ({ ...prev, terminateSession: false }));
    }
  };

  // Format event type for display
  const formatEventType = (eventType: string) => {
    return eventType
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Get event type color
  const getEventTypeColor = (eventType: string, successful: boolean) => {
    if (!successful) return "text-red-500";

    if (eventType.includes("LOGIN") || eventType.includes("LOGOUT")) {
      return "text-blue-500";
    } else if (eventType.includes("PASSWORD")) {
      return "text-purple-500";
    } else if (eventType.includes("SUSPICIOUS") || eventType.includes("NEW_")) {
      return "text-amber-500";
    } else if (eventType.includes("ACCOUNT_DELETED")) {
      return "text-red-500";
    } else {
      return "text-green-500";
    }
  };

  const logSecurityEvent = useCallback(
    async (payload: SecurityEventPayload) => {
      try {
        const response = await fetch("/api/user/security-log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to log security event");
        }

        return await response.json();
      } catch (error) {
        console.error("Error logging security event:", error);
        // Don't show a toast for this - it's a background operation
        return null;
      }
    },
    []
  );

  return {
    securityLog,
    activeSessions,
    loading,
    error,
    pagination,
    filters,
    fetchSecurityLog,
    fetchActiveSessions,
    terminateSession,
    terminateAllSessions,
    updateFilters,
    formatEventType,
    getEventTypeColor,
    logSecurityEvent,
  };
}
