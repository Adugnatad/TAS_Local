import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";
import { orgKeys } from "./keys";

export function useOrgDocuments(orgId: string) {
  return useQuery({
    queryKey: orgKeys.documents(orgId),
    queryFn: () => api.fetchOrgDocuments(orgId),
    enabled: Boolean(orgId),
  });
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: ["document-types"],
    queryFn: () => api.fetchDocumentTypes(),
    staleTime: 5 * 60_000,
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
      mutationFn: (input: { file: File; type: string; documentName?: string }) =>
        api.uploadOrgDocument(orgId, input.file, {
          type: input.type,
          documentName: input.documentName,
        }),
      onSuccess: invalidate,
    }),
    uploadBusinessLicense: useMutation({
      mutationFn: (file: File) => api.uploadBusinessLicense(orgId, file),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (documentId: string) => api.deleteOrgDocument(orgId, documentId),
      onSuccess: invalidate,
    }),
  };
}
