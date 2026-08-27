"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { downloadOrgDocument } from "../api";
import { useDocumentTypes, useOrgDocuments, useUploadOrgDocument } from "../hooks";
import { formatOrgApiError } from "../tin";
import { useSession } from "@/features/auth/hooks/useSession";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OrganizationDocumentsPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const canManage = can("MANAGE_ORGANIZATIONS");
  const query = useOrgDocuments(orgId);
  const documentTypes = useDocumentTypes();
  const mutations = useUploadOrgDocument(orgId);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("BUSINESS_LICENSE");
  const [documentName, setDocumentName] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const typeOptions = useMemo(() => {
    if (documentTypes.data?.length) return documentTypes.data;
    return DOCUMENT_TYPES.map((code) => ({ code, label: code }));
  }, [documentTypes.data]);

  const needsName = type === "Other" || type.toUpperCase() === "OTHER";

  async function onUpload() {
    if (!file) return;
    if (needsName && !documentName.trim()) {
      toast.error("Document name is required when type is Other.");
      return;
    }
    try {
      await mutations.upload.mutateAsync({
        file,
        type,
        documentName: needsName ? documentName.trim() : undefined,
      });
      toast.success("Document uploaded.");
      setFile(null);
      setDocumentName("");
    } catch (error) {
      toast.error(formatOrgApiError(error, "Upload failed."));
    }
  }

  async function onUploadLicense() {
    if (!licenseFile) return;
    try {
      await mutations.uploadBusinessLicense.mutateAsync(licenseFile);
      toast.success("Business license uploaded.");
      setLicenseFile(null);
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
          {query.data.map((doc) => {
            const label =
              doc.documentName ||
              doc.fileName ||
              doc.docType ||
              doc.type ||
              doc.id;
            return (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span>{label}</span>
                  {(doc.docType || doc.type) && (
                    <span className="text-xs text-muted-foreground">
                      {doc.docType || doc.type}
                    </span>
                  )}
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
            );
          })}
        </ul>
      )}

      {canManage && (
        <div className="grid max-w-xl gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Upload document</Label>
            <Select value={type} onValueChange={(value) => value && setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Document type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {needsName && (
              <Input
                placeholder="Document name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            )}
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button onClick={onUpload} disabled={!file || mutations.upload.isPending}>
              Upload
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-license">Replace business license</Label>
            <Input
              id="business-license"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
            />
            <Button
              onClick={onUploadLicense}
              disabled={!licenseFile || mutations.uploadBusinessLicense.isPending}
            >
              Upload license
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
