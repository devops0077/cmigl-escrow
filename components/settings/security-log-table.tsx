"use client";

import { useState } from "react";
import { useSecurity, type SecurityEvent } from "@/hooks/use-security";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SecurityLogTable() {
  const {
    securityLog,
    loading,
    pagination,
    filters,
    updateFilters,
    formatEventType,
    getEventTypeColor,
  } = useSecurity();

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [page, setPage] = useState(1);

  // Event type options
  const eventTypeOptions = [
    { value: "all", label: "All Events" },
    { value: "LOGIN_SUCCESS,LOGIN_FAILED,LOGOUT", label: "Login Activity" },
    {
      value:
        "PASSWORD_CHANGED,PASSWORD_RESET_REQUESTED,PASSWORD_RESET_COMPLETED",
      label: "Password Events",
    },
    {
      value: "NEW_DEVICE_DETECTED,NEW_LOCATION_DETECTED,SUSPICIOUS_ACTIVITY",
      label: "Security Alerts",
    },
    {
      value: "SETTINGS_CHANGED,PROFILE_UPDATED,EMAIL_CHANGED",
      label: "Account Changes",
    },
    {
      value: "SESSION_REVOKED,ALL_SESSIONS_REVOKED",
      label: "Session Management",
    },
  ];

  // Success filter options
  const successOptions = [
    { value: "all", label: "All" },
    { value: "true", label: "Successful" },
    { value: "false", label: "Failed" },
  ];

  // Apply date filters
  const applyDateFilter = () => {
    updateFilters({
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
    });
  };

  // Reset filters
  const resetFilters = () => {
    updateFilters({
      eventType: "",
      startDate: "",
      endDate: "",
      successful: "",
    });
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Get event icon
  const getEventIcon = (event: SecurityEvent) => {
    if (!event.successful) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    if (
      event.eventType.includes("SUSPICIOUS") ||
      event.eventType.includes("NEW_")
    ) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    } else if (event.successful) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 md:flex-row md:items-end md:space-x-2 md:space-y-0">
        <div className="space-y-1">
          <p className="text-sm font-medium">Event Type</p>
          <Select
            value={filters.eventType}
            onValueChange={(value) => updateFilters({ eventType: value })}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              {eventTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Status</p>
          <Select
            value={filters.successful}
            onValueChange={(value) => updateFilters({ successful: value })}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {successOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Start Date</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal md:w-[200px]",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">End Date</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal md:w-[200px]",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex space-x-2">
          <Button onClick={applyDateFilter} disabled={loading.securityLog}>
            Apply
          </Button>
          <Button
            variant="outline"
            onClick={resetFilters}
            disabled={loading.securityLog}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Date & Time</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {securityLog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {loading.securityLog
                    ? "Loading security events..."
                    : "No security events found"}
                </TableCell>
              </TableRow>
            ) : (
              securityLog.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-xs">
                    {format(new Date(event.createdAt), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getEventIcon(event)}
                      <span
                        className={getEventTypeColor(
                          event.eventType,
                          event.successful
                        )}
                      >
                        {formatEventType(event.eventType)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {JSON.parse(event.deviceInfo as string)?.os || "N/A"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {event.userAgent || "N/A"}
                  </TableCell>
                  <TableCell>
                    {event.successful ? (
                      <span className="text-green-500">Success</span>
                    ) : (
                      <span className="text-red-500">Failed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (pagination.page > 1) {
                  updateFilters({ ...filters, page: pagination.page - 1 })
                }
              }}
              className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  updateFilters({ ...filters, page: page })
                }}
                isActive={page === pagination.page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (pagination.page < pagination.totalPages) {
                  updateFilters({ ...filters, page: pagination.page + 1 })
                }
              }}
              className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination> */}
      {/* <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => {}}
      /> */}
    </div>
  );
}
