"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { downloadOrgDocument } from "../api";
import { useDocumentTypes, useOrgDocuments, useOrganization, useUploadOrgDocument } from "../hooks";
import { formatOrgApiError } from "../tin";
import type { OrgDocument } from "../types";
import { useSession } from "@/features/auth/hooks/useSession";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function documentSourceLabel(source?: string | null) {
  if (!source) return "—";
  if (source === "COOP_INTERNAL") return "Internal";
  if (source === "COOP_CUSTOMER") return "Customer";
  return source;
}

function versionKey(doc: OrgDocument) {
  return `${doc.docType || doc.type || "Other"}::${doc.documentName || ""}`;
}

function isImageUrl(url: string, fileName?: string) {
  const name = fileName || url;
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
}

export function OrganizationDocumentsPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const org = useOrganization(orgId);
  const canManage = can("MANAGE_ORGANIZATIONS") && org.data?.status !== "TERMINATED";
  const [includeHistory, setIncludeHistory] = useState(false);
  const query = useOrgDocuments(orgId, { includeHistory });
  const documentTypes = useDocumentTypes();
  const mutations = useUploadOrgDocument(orgId);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("BUSINESS_LICENSE");
  const [documentName, setDocumentName] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseName, setLicenseName] = useState("");

  const typeOptions = useMemo(() => {
    if (documentTypes.data?.length) return documentTypes.data;
    return DOCUMENT_TYPES.map((code) => ({ code, label: code }));
  }, [documentTypes.data]);

  const needsName = type === "Other" || type.toUpperCase() === "OTHER";

  const grouped = useMemo(() => {
    const docs = query.data ?? [];
    const map = new Map<string, OrgDocument[]>();
    for (const doc of docs) {
      const key = versionKey(doc);
      const list = map.get(key) ?? [];
      list.push(doc);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([key, versions]) => ({
      key,
      versions: [...versions].sort((a, b) => (b.version ?? 0) - (a.version ?? 0)),
    }));
  }, [query.data]);

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
      await mutations.uploadBusinessLicense.mutateAsync({
        file: licenseFile,
        documentName: licenseName.trim() || undefined,
      });
      toast.success("Business license uploaded.");
      setLicenseFile(null);
      setLicenseName("");
    } catch (error) {
      toast.error(formatOrgApiError(error, "Upload failed."));
    }
  }

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={includeHistory}
          onChange={(e) => setIncludeHistory(e.target.checked)}
        />
        Show version history
      </label>

      {!grouped.length ? (
        <EmptyState title="No documents" />
      ) : (
        <ul className="space-y-3">
          {grouped.map((group) => (
            <li key={group.key} className="space-y-2 rounded-md border p-3">
              {group.versions.map((doc) => {
                const label =
                  doc.documentName || doc.fileName || doc.docType || doc.type || doc.id;
                return (
                  <div
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="font-medium">{label}</span>
                      {(doc.docType || doc.type) && (
                        <span className="text-xs text-muted-foreground">
                          {doc.docType || doc.type}
                        </span>
                      )}
                      {doc.version != null && (
                        <span className="text-xs text-muted-foreground">v{doc.version}</span>
                      )}
                      {doc.current === false && (
                        <span className="text-xs text-muted-foreground">previous</span>
                      )}
                      {doc.validationStatus && <StatusBadge status={doc.validationStatus} />}
                      <span className="text-xs text-muted-foreground">
                        Source {documentSourceLabel(doc.source)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {doc.uploadedByName ?? "—"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {doc.url && isImageUrl(doc.url, doc.fileName ?? undefined) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={doc.url}
                          alt={label}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Open
                        </a>
                      ) : (
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
                      )}
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
                  </div>
                );
              })}
            </li>
          ))}
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
            <Label htmlFor="business-license">Business license</Label>
            <Input
              placeholder="Document name (optional)"
              value={licenseName}
              onChange={(e) => setLicenseName(e.target.value)}
            />
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
