export interface PortalNotification {
  id: string;
  title?: string;
  message?: string;
  body?: string;
  read?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export interface UnreadCountResponse {
  count?: number;
  unreadCount?: number;
}
