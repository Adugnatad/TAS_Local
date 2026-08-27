"use client";

import { useMemo, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import {
  useNotificationMutations,
  useNotifications,
  useUnreadNotificationCount,
} from "../hooks";
import { useNotificationSocket } from "../hooks/useNotificationSocket";
import type { PortalNotification } from "../types";
import type { PageResponse } from "@/types/global";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function asList(
  data: PageResponse<PortalNotification> | PortalNotification[] | undefined,
): PortalNotification[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.content;
}

function formatWhen(value?: string) {
  if (!value) return "";
  try {
    const date = value.includes("T") ? parseISO(value) : new Date(value);
    return isValid(date) ? format(date, "MMM d, HH:mm") : value;
  } catch {
    return value;
  }
}

export function NotificationBell() {
  useNotificationSocket();
  const [open, setOpen] = useState(false);
  const unread = useUnreadNotificationCount();
  const list = useNotifications({ page: 0, size: 10 });
  const mutations = useNotificationMutations();
  const items = useMemo(() => asList(list.data), [list.data]);
  const count = unread.data ?? 0;

  async function onMarkOne(id: string) {
    try {
      await mutations.markRead.mutateAsync(id);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not mark as read.");
    }
  }

  async function onMarkAll() {
    try {
      await mutations.markAllRead.mutateAsync();
      toast.success("All notifications marked read.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not mark all as read.");
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
          />
        }
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => void onMarkAll()}
              disabled={mutations.markAllRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list.isLoading ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Loading…</p>
        ) : !items.length ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No notifications</p>
        ) : (
          items.map((item) => {
            const text = item.message || item.body || item.title || "Notification";
            return (
              <DropdownMenuItem
                key={item.id}
                className="flex cursor-pointer flex-col items-start gap-1 py-2"
                onClick={() => {
                  if (!item.read) void onMarkOne(item.id);
                }}
              >
                <span className={item.read ? "text-muted-foreground" : "font-medium"}>
                  {item.title && item.message ? item.title : text}
                </span>
                {item.title && item.message && (
                  <span className="text-xs text-muted-foreground line-clamp-2">{item.message}</span>
                )}
                {item.createdAt && (
                  <span className="text-[11px] text-muted-foreground">
                    {formatWhen(item.createdAt)}
                  </span>
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
