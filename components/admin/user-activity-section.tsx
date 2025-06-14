"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  LogIn,
  LogOut,
  Settings,
  Shield,
  User,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface SecurityLog {
  id: string;
  eventType: string;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  successful: boolean;
  createdAt: string;
  metadata: any;
}

interface ActivityData {
  securityLogs: SecurityLog[];
  stats: {
    totalLogins: number;
    failedLogins: number;
    lastLogin: string | null;
    uniqueIPs: number;
  };
}

interface UserActivitySectionProps {
  userId: string;
}

export function UserActivitySection({ userId }: UserActivitySectionProps) {
  const {
    data: activityData,
    isLoading,
    isError,
  } = useQuery<ActivityData>({
    queryKey: ["admin-user-activity", userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/activity`);
      if (!response.ok) {
        throw new Error("Failed to fetch activity data");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !activityData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Failed to load activity data</p>
        </CardContent>
      </Card>
    );
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "LOGIN_SUCCESS":
        return <LogIn className="h-4 w-4 text-green-600" />;
      case "LOGIN_FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "LOGOUT":
        return <LogOut className="h-4 w-4 text-gray-600" />;
      case "PASSWORD_CHANGED":
        return <Lock className="h-4 w-4 text-blue-600" />;
      case "PROFILE_UPDATED":
        return <User className="h-4 w-4 text-blue-600" />;
      case "SETTINGS_CHANGED":
        return <Settings className="h-4 w-4 text-blue-600" />;
      case "ACCOUNT_LOCKED":
        return <Lock className="h-4 w-4 text-red-600" />;
      case "ACCOUNT_UNLOCKED":
        return <Unlock className="h-4 w-4 text-green-600" />;
      case "SUSPICIOUS_ACTIVITY":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventDescription = (eventType: string, metadata: any) => {
    switch (eventType) {
      case "LOGIN_SUCCESS":
        return "Successful login";
      case "LOGIN_FAILED":
        return "Failed login attempt";
      case "LOGOUT":
        return "User logged out";
      case "PASSWORD_CHANGED":
        return "Password changed";
      case "PROFILE_UPDATED":
        return `Profile updated: ${metadata?.fields?.join(", ") || "unknown fields"}`;
      case "SETTINGS_CHANGED":
        return `Settings changed: ${metadata?.settings?.join(", ") || "unknown settings"}`;
      case "ACCOUNT_LOCKED":
        return "Account locked";
      case "ACCOUNT_UNLOCKED":
        return "Account unlocked";
      case "SUSPICIOUS_ACTIVITY":
        return "Suspicious activity detected";
      default:
        return eventType.replace(/_/g, " ").toLowerCase();
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <LogIn className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activityData.stats.totalLogins}
            </div>
            <p className="text-xs text-muted-foreground">Successful logins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {activityData.stats.failedLogins}
            </div>
            <p className="text-xs text-muted-foreground">Failed attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Login</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {activityData.stats.lastLogin
                ? formatDistanceToNow(new Date(activityData.stats.lastLogin), {
                    addSuffix: true,
                  })
                : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">Most recent login</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activityData.stats.uniqueIPs}
            </div>
            <p className="text-xs text-muted-foreground">
              Different IP addresses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Security Activity Log
          </CardTitle>
          <CardDescription>
            Recent security events and user activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityData.securityLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No activity found</p>
              <p className="text-sm text-muted-foreground">
                No security events have been logged for this user
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityData.securityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(log.eventType)}
                          <span className="text-sm font-medium">
                            {log.eventType.replace(/_/g, " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getEventDescription(log.eventType, log.metadata)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {log.ipAddress || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {log.location || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.successful ? "default" : "destructive"}
                        >
                          {log.successful ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {format(new Date(log.createdAt), "MMM dd, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.createdAt), "HH:mm:ss")}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
