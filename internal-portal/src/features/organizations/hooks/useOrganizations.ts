import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";
import type { OrganizationWritePayload } from "../types";
import { orgKeys, type OrgListParams } from "./keys";

export function useOrganizations(params: OrgListParams) {
  return useQuery({
    queryKey: orgKeys.list(params),
    queryFn: () => api.fetchOrganizations(params),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: orgKeys.detail(id),
    queryFn: () => api.fetchOrganization(id),
    enabled: Boolean(id),
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      file,
    }: {
      payload: OrganizationWritePayload;
      file?: File | null;
    }) => api.createOrganization(payload, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.all }),
  });
}

export function useUpdateOrganization(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrganizationWritePayload) => api.updateOrganization(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.detail(id) }),
  });
}

export function useAccountLookup() {
  return useMutation({
    mutationFn: (accountNumber: string) => api.lookupAccount(accountNumber),
  });
}

export function useOrgLifecycle(id: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: orgKeys.all });
  return {
    suspend: useMutation({ mutationFn: () => api.suspendOrganization(id), onSuccess: invalidate }),
    activate: useMutation({ mutationFn: () => api.activateOrganization(id), onSuccess: invalidate }),
    terminate: useMutation({
      mutationFn: () => api.terminateOrganization(id),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: () => api.deleteOrganization(id), onSuccess: invalidate }),
    revalidate: useMutation({
      mutationFn: () => api.revalidateOrganization(id),
      onSuccess: invalidate,
    }),
    verifyTin: useMutation({
      mutationFn: () => api.verifyTin(id),
      onSuccess: invalidate,
    }),
    verifyManual: useMutation({
      mutationFn: (note: string) => api.verifyManual(id, note),
      onSuccess: invalidate,
    }),
  };
}

export function useAssignOrganizationCse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cseUserId: string) => api.assignOrganizationCse(id, cseUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.detail(id) });
      qc.invalidateQueries({ queryKey: orgKeys.all });
    },
  });
}
