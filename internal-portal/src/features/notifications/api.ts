import { apiClient } from "@/lib/api-client";
import type { ApiListParams, PageResponse } from "@/types/global";
import type { PortalNotification, UnreadCountResponse } from "./types";

export async function fetchNotifications(
  params?: ApiListParams,
): Promise<PageResponse<PortalNotification> | PortalNotification[]> {
  return apiClient("/notifications", { params });
}

export async function fetchUnreadCount(): Promise<number> {
  const data = await apiClient<UnreadCountResponse | number>("/notifications/unread-count");
  if (typeof data === "number") return data;
  return data.count ?? data.unreadCount ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  return apiClient(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  return apiClient("/notifications/read-all", { method: "POST" });
}
