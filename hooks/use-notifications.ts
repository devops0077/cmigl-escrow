import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  userId: string;
}

interface NotificationsResponse {
  data: Notification[];
  meta: {
    totalCount: number;
    unreadCount: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
}

export function useNotifications(page = 1, limit = 10, unreadOnly = false) {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", { page, limit, unreadOnly }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (unreadOnly) params.append("unread", "true");

      const response = await apiClient.get(
        `/notifications?${params.toString()}`
      );
      return response.data;
    },
  });
}

export function useUnreadNotificationsCount() {
  return useQuery<{ meta: { unreadCount: number } }>({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", "1");
      params.append("unread", "true");

      const response = await apiClient.get(
        `/notifications?${params.toString()}`
      );
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids }: { ids: string[] }) => {
      return apiClient.patch("/notifications", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiClient.patch("/notifications", { readAll: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });
}
