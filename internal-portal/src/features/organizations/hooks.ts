import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiListParams } from "@/types/global";
import type { OrgStatus } from "@/lib/constants";
import * as api from "./api";
import type { CreateOrgUserInput, OrganizationWritePayload, UpdateOrgUserInput } from "./types";

export const orgKeys = {
  all: ["organizations"] as const,
  list: (params: unknown) => [...orgKeys.all, "list", params] as const,
  detail: (id: string) => [...orgKeys.all, "detail", id] as const,
  users: (id: string, params: unknown) => [...orgKeys.all, id, "users", params] as const,
  accounts: (id: string) => [...orgKeys.all, id, "accounts"] as const,
  documents: (id: string) => [...orgKeys.all, id, "documents"] as const,
};

export function useOrganizations(params: ApiListParams & { status?: OrgStatus | "" }) {
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

export function useOrgUsers(orgId: string, params: ApiListParams) {
  return useQuery({
    queryKey: orgKeys.users(orgId, params),
    queryFn: () => api.fetchOrgUsers(orgId, params),
    enabled: Boolean(orgId),
  });
}

export function useCreateOrgUser(orgId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [...orgKeys.all, orgId, "users"] });
  return useMutation({
    mutationFn: (input: CreateOrgUserInput) => api.createOrgUser(orgId, input),
    onSuccess: invalidate,
  });
}

export function useOrgUserMutations(orgId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [...orgKeys.all, orgId, "users"] });
    qc.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
  };
  return {
    update: useMutation({
      mutationFn: ({ userId, input }: { userId: string; input: UpdateOrgUserInput }) =>
        api.updateOrgUser(orgId, userId, input),
      onSuccess: invalidate,
    }),
    setActive: useMutation({
      mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
        api.setOrgUserActive(orgId, userId, active),
      onSuccess: invalidate,
    }),
    resetPassword: useMutation({
      mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
        api.resetOrgUserPassword(orgId, userId, newPassword),
      onSuccess: invalidate,
    }),
  };
}

export function useOrgAccounts(orgId: string) {
  return useQuery({
    queryKey: orgKeys.accounts(orgId),
    queryFn: () => api.fetchOrgAccounts(orgId),
    enabled: Boolean(orgId),
  });
}

export function useCreateOrgAccount(orgId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: orgKeys.accounts(orgId) });
    qc.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
  };
  return {
    create: useMutation({
      mutationFn: (input: Parameters<typeof api.createOrgAccount>[1]) =>
        api.createOrgAccount(orgId, input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        accountId,
        input,
      }: {
        accountId: string;
        input: Parameters<typeof api.updateOrgAccount>[2];
      }) => api.updateOrgAccount(orgId, accountId, input),
      onSuccess: invalidate,
    }),
    setPrimary: useMutation({
      mutationFn: (accountId: string) => api.setPrimaryOrgAccount(orgId, accountId),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (accountId: string) => api.deleteOrgAccount(orgId, accountId),
      onSuccess: invalidate,
    }),
  };
}

export function useOrgDocuments(orgId: string) {
  return useQuery({
    queryKey: orgKeys.documents(orgId),
    queryFn: () => api.fetchOrgDocuments(orgId),
    enabled: Boolean(orgId),
  });
}

export function useUploadOrgDocument(orgId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
    qc.invalidateQueries({ queryKey: orgKeys.documents(orgId) });
  };
  return {
    upload: useMutation({
      mutationFn: (file: File) => api.uploadOrgDocument(orgId, file),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (documentId: string) => api.deleteOrgDocument(orgId, documentId),
      onSuccess: invalidate,
    }),
  };
}
