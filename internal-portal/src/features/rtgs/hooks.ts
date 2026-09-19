import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";

const rtgsKeys = {
  all: ["rtgs"] as const,
  queue: (page: number, size: number) => ["rtgs", "queue", page, size] as const,
  detail: (id: string) => ["rtgs", "detail", id] as const,
};

export function useRtgsQueue(page: number, size: number) {
  return useQuery({
    queryKey: rtgsKeys.queue(page, size),
    queryFn: () => api.fetchAwaitingAcknowledgement({ page, size }),
  });
}

export function useRtgsTransfer(id: string | null) {
  return useQuery({
    queryKey: rtgsKeys.detail(id ?? ""),
    queryFn: () => api.fetchRtgsTransfer(id!),
    enabled: Boolean(id),
  });
}

export function useAcknowledgeRtgsTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      api.acknowledgeRtgsTransfer(id, note),
    onSuccess: (transfer) => {
      queryClient.setQueryData(rtgsKeys.detail(transfer.id), transfer);
      queryClient.invalidateQueries({ queryKey: rtgsKeys.all });
    },
  });
}
