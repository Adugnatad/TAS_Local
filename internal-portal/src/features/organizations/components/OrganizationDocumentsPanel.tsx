"use client";

import { useState } from "react";
import { toast } from "sonner";
import { downloadOrgDocument } from "../api";
import { useOrgDocuments, useUploadOrgDocument } from "../hooks";
import { formatOrgApiError } from "../tin";
import { useSession } from "@/features/auth/hooks/useSession";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrganizationDocumentsPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const canManage = can("MANAGE_ORGANIZATIONS");
  const query = useOrgDocuments(orgId);
  const mutations = useUploadOrgDocument(orgId);
  const [file, setFile] = useState<File | null>(null);

  async function onUpload() {
    if (!file) return;
    try {
      await mutations.upload.mutateAsync(file);
      toast.success("Document uploaded.");
      setFile(null);
    } catch (error) {
      toast.error(formatOrgApiError(error, "Upload failed."));
    }
  }

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      {!query.data?.length ? (
        <EmptyState title="No documents" />
      ) : (
        <ul className="space-y-2">
          {query.data.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <span>{doc.fileName ?? doc.type ?? doc.id}</span>
                {doc.validationStatus && <StatusBadge status={doc.validationStatus} />}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadOrgDocument(orgId, doc.id).catch((error) =>
                      toast.error(formatOrgApiError(error, "Download failed.")),
                    )
                  }
                >
                  Download
                </Button>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      mutations.remove
                        .mutateAsync(doc.id)
                        .then(() => toast.success("Document removed."))
                        .catch((error) => toast.error(formatOrgApiError(error)))
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="max-w-md space-y-2">
          <Label htmlFor="doc">Business license</Label>
          <Input
            id="doc"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button onClick={onUpload} disabled={!file || mutations.upload.isPending}>
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}
