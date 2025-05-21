import type { SecurityEventType } from "@/lib/generated/prisma";

export interface SecurityLogEntry {
  id: string;
  userId: string;
  eventType: SecurityEventType;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceInfo?: string | null;
  location?: string | null;
  metadata?: Record<string, any> | null;
  successful: boolean;
  sessionId?: string | null;
  createdAt: Date;
}

export interface SecurityLogResponse {
  data: SecurityLogEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ActiveSession {
  id: string;
  userAgent: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
}

export interface SecurityEventPayload {
  type: SecurityEventType;
  email: string;
  metadata?: Record<string, any>;
  successful?: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  location?: string;
  sessionId?: string;
  userId?: string;
  // Additional fields for specific event types
  oldEmail?: string;
  newEmail?: string;
  updatedFields?: string[];
  changedSettings?: string[];
  reason?: string;
}
