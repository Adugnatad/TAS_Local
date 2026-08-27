import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiListParams } from "@/types/global";
import * as api from "../api";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params?: unknown) => [...notificationKeys.all, "list", params] as const,
  unread: [...["notifications"], "unread"] as const,
};

export function useNotifications(params?: ApiListParams) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => api.fetchNotifications(params),
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => api.fetchUnreadCount(),
    refetchInterval: 60_000,
  });
}

export function useNotificationMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: notificationKeys.all });
  return {
    markRead: useMutation({
      mutationFn: (id: string) => api.markNotificationRead(id),
      onSuccess: invalidate,
    }),
    markAllRead: useMutation({
      mutationFn: () => api.markAllNotificationsRead(),
      onSuccess: invalidate,
    }),
  };
}
