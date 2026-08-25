"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useCatalogs, useLoanMutations, useLoanRequest, useLoanRequests } from "../hooks";
import { useSession } from "@/features/auth/hooks/useSession";
import { ApiError } from "@/lib/api-client";
import { formatOrgApiError } from "@/features/organizations/tin";
import { cn } from "@/lib/utils";
import type { PageResponse } from "@/types/global";
import type { LoanRequest } from "../types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function asList(data: PageResponse<LoanRequest> | LoanRequest[] | undefined): LoanRequest[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.content;
}

export function LoanRequestList({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const query = useLoanRequests(orgId, { page: 0, size: 20 });
  const items = asList(query.data);

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-4">
      {can("MANAGE_ORGANIZATIONS") && (
        <Link href={`/organizations/${orgId}/loans/new`} className={cn(buttonVariants())}>
          Create loan request
        </Link>
      )}
      {!items.length ? (
        <EmptyState title="No loan requests" />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/organizations/${orgId}/loans/${item.id}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/40"
              >
                <span className="font-medium">{item.id}</span>
                <span className="flex gap-2">
                  {item.status && <StatusBadge status={String(item.status)} />}
                  {item.coopStreamStatus && (
                    <StatusBadge status={String(item.coopStreamStatus)} />
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LoanRequestDetail({ orgId, loanId }: { orgId: string; loanId: string }) {
  const { can } = useSession();
  const query = useLoanRequest(orgId, loanId);
  const mutations = useLoanMutations(orgId);

  async function onSubmit() {
    try {
      const result = await mutations.submit.mutateAsync(loanId);
      toast.success("Submitted.");
      if (result.coopStreamStatus) toast.message(String(result.coopStreamStatus));
    } catch (error) {
      toast.error(formatOrgApiError(error, "Submit failed."));
    }
  }

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-4">
      {can("MANAGE_ORGANIZATIONS") && (
        <Button onClick={onSubmit} disabled={mutations.submit.isPending}>
          Submit (triggers CoopStream)
        </Button>
      )}
      <pre className="overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
        {JSON.stringify(query.data, null, 2)}
      </pre>
    </div>
  );
}

export function LoanRequestCreate({ orgId }: { orgId: string }) {
  const mutations = useLoanMutations(orgId);
  const catalogs = useCatalogs();
  const [json, setJson] = useState("{\n  \n}");

  async function onCreate() {
    try {
      const body = JSON.parse(json) as Record<string, unknown>;
      const created = await mutations.create.mutateAsync(body);
      toast.success("Created.");
      window.location.href = `/organizations/${orgId}/loans/${created.id}`;
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON.");
        return;
      }
      const apiError = error instanceof ApiError ? error : null;
      toast.error(apiError?.message ?? "Create failed.");
      if (apiError?.fieldErrors?.length) {
        toast.message(apiError.fieldErrors.map((f) => `${f.field}: ${f.message}`).join(" · "));
      }
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Request body matches the customer portal loan-request contract. Paste JSON until that
        schema is checked into this repo. Create is allowed for unverified orgs; submit requires TIN
        VALIDATED (verify-tin or team verify).
      </p>
      {catalogs.data && (
        <details className="text-xs">
          <summary className="cursor-pointer">Product catalog / business types</summary>
          <pre className="mt-2 overflow-auto rounded-md border bg-muted/40 p-3">
            {JSON.stringify(catalogs.data, null, 2)}
          </pre>
        </details>
      )}
      <div className="space-y-1">
        <Label htmlFor="loan-json">JSON body</Label>
        <textarea
          id="loan-json"
          className="min-h-48 w-full rounded-md border border-input bg-card p-3 font-mono text-sm"
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
      </div>
      <Button onClick={onCreate} disabled={mutations.create.isPending}>
        Create
      </Button>
    </div>
  );
}
