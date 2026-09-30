"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { revalidateOrganization } from "../api";
import type { OrganizationDetail } from "../types";
import { formatOrgApiError, tinVerificationLabel } from "../tin";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ValidateBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialOrgId?: string;
  onSuccess?: (org: OrganizationDetail) => void;
}

export function ValidateBusinessDialog({
  open,
  onOpenChange,
  initialOrgId = "",
  onSuccess,
}: ValidateBusinessDialogProps) {
  const [orgId, setOrgId] = useState(initialOrgId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrganizationDetail | null>(null);

  useEffect(() => {
    if (open) {
      setOrgId(initialOrgId);
      setError(null);
      setResult(null);
    }
  }, [open, initialOrgId]);

  async function handleValidate(idToValidate?: string) {
    const targetId = (idToValidate ?? orgId).trim();
    if (!targetId) {
      setError("Please enter a valid Organization ID");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await revalidateOrganization(targetId);
      setResult(data);
      toast.success(`Business validation complete: ${data.name ?? targetId}`);
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      const formatted = formatOrgApiError(err, "Validation failed. Please verify the Organization ID.");
      setError(formatted);
      toast.error(formatted);
    } finally {
      setIsLoading(false);
    }
  }

  function handleUseExampleId() {
    const exampleId = "5d7a3cb9-f370-434e-a359-310c81cc1122";
    setOrgId(exampleId);
    setError(null);
  }

  const tin = result ? tinVerificationLabel(result) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="size-5" />
            <DialogTitle>Validate Business by Organization ID</DialogTitle>
          </div>
          <DialogDescription>
            Trigger external business and TIN validation for an organization contract.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="validate-org-id">Organization ID (UUID)</Label>
              <button
                type="button"
                onClick={handleUseExampleId}
                className="text-xs text-primary hover:underline font-mono"
              >
                Use sample ID
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                id="validate-org-id"
                placeholder="e.g. 5d7a3cb9-f370-434e-a359-310c81cc1122"
                value={orgId}
                onChange={(e) => {
                  setOrgId(e.target.value);
                  setError(null);
                }}
                disabled={isLoading}
                className="font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Endpoint: <code className="text-[11px] bg-muted px-1 py-0.5 rounded">POST /api/v1/organizations/&#123;id&#125;/revalidate</code>
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="size-4" />
              <AlertTitle>Validation failed</AlertTitle>
              <AlertDescription className="text-xs mt-1">{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2 border-b pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="font-semibold text-foreground">
                      {result.name ?? "Organization"}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5">
                    ID: {result.id}
                  </p>
                </div>
                {result.status && <StatusBadge status={result.status} />}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">TIN:</span>{" "}
                  <span className="font-mono font-medium">{result.tin ?? "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">TIN Verification:</span>{" "}
                  {tin && <StatusBadge status={tin.status} label={tin.label} />}
                </div>
                <div>
                  <span className="text-muted-foreground">Form of Business:</span>{" "}
                  <span className="font-medium">{result.formOfBusiness ?? "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Accounts:</span>{" "}
                  <span className="font-medium">{result.accounts?.length ?? 0}</span>
                </div>
                {result.tinNameMatchPercent != null && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Name match:</span>{" "}
                    <span className="font-medium">{result.tinNameMatchPercent}%</span>
                  </div>
                )}
                {result.tinValidationReason && (
                  <div className="col-span-2 text-muted-foreground">
                    Reason: {result.tinValidationReason}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex justify-end">
                <Link
                  href={`/organizations/${result.id}`}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                >
                  <span>Open contract profile</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={() => handleValidate()}
            disabled={isLoading || !orgId.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Validating...</span>
              </>
            ) : (
              <>
                {result ? (
                  <>
                    <RotateCw className="size-4" />
                    <span>Revalidate</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    <span>Validate Business</span>
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
