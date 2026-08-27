"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Client } from "@stomp/stompjs";
import { getAccessToken } from "@/lib/token-store";
import { useSession } from "@/features/auth/hooks/useSession";
import { notificationKeys } from "../hooks";

function wsBrokerUrl(): string {
  if (typeof window === "undefined") return "ws://localhost/ws";
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;
  return `${proto}://${window.location.host}/ws`;
}

/**
 * Subscribe to live notifications over STOMP. Falls back to REST polling (via
 * React Query refetchInterval) if the socket cannot connect.
 */
export function useNotificationSocket() {
  const { isAuthenticated } = useSession();
  const queryClient = useQueryClient();
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = getAccessToken();
    if (!token) return;

    const client = new Client({
      brokerURL: wsBrokerUrl(),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 10_000,
      heartbeatIncoming: 20_000,
      heartbeatOutgoing: 20_000,
      onConnect: () => {
        client.subscribe("/user/queue/notifications", () => {
          void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        });
      },
      onStompError: () => {
        // REST polling remains active via refetchInterval.
      },
      onWebSocketError: () => {
        // REST polling remains active via refetchInterval.
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      void client.deactivate();
      clientRef.current = null;
    };
  }, [isAuthenticated, queryClient]);
}
