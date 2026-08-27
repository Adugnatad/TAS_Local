"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";
import { useLoanRequest, useLoanRequestEnums, useLoanRequests } from "../hooks";
import { fetchAuthorized, fetchEvaluation } from "@/features/signatory-matrix/api";
import type { MatrixEvaluation } from "@/features/signatory-matrix/types";
import { cn } from "@/lib/utils";
import type { PageResponse } from "@/types/global";
import type { LoanRequest } from "../types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function asList(data: PageResponse<LoanRequest> | LoanRequest[] | undefined): LoanRequest[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.content;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    const date = value.includes("T") ? parseISO(value) : new Date(value);
    return isValid(date) ? format(date, "MMM d, yyyy HH:mm") : value;
  } catch {
    return value;
  }
}

function formatAmount(amount?: number, currency?: string) {
  if (amount == null || Number.isNaN(amount)) return "—";
  const formatted = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(amount);
  return currency ? `${formatted} ${currency}` : formatted;
}

function formatDetailsValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function enumLabel(enums: unknown, field: string, code: string): string {
  if (!enums || typeof enums !== "object") return code;
  const catalog = enums as Record<string, unknown>;
  const options = catalog[field];
  if (!Array.isArray(options)) return code;
  for (const item of options) {
    if (typeof item === "string" && item === code) return code;
    if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      const value = String(row.code ?? row.value ?? row.id ?? "");
      if (value === code) {
        return String(row.label ?? row.name ?? row.description ?? code);
      }
    }
  }
  return code;
}

function LoanMatrixStatus({ orgId, loan }: { orgId: string; loan: LoanRequest }) {
  const evaluationId =
    typeof loan.evaluationId === "string"
      ? loan.evaluationId
      : typeof loan.matrixEvaluationId === "string"
        ? loan.matrixEvaluationId
        : undefined;
  const requestRef = loan.requestRef;

  const byId = useQuery({
    queryKey: ["matrix-evaluation", orgId, evaluationId],
    queryFn: () => fetchEvaluation(orgId, evaluationId!),
    enabled: Boolean(orgId && evaluationId),
  });

  const byRef = useQuery({
    queryKey: ["matrix-authorized", orgId, requestRef],
    queryFn: () => fetchAuthorized(orgId, requestRef!) as Promise<MatrixEvaluation>,
    enabled: Boolean(orgId && requestRef && !evaluationId),
  });

  const query = evaluationId ? byId : byRef;
  const evaluation = query.data as MatrixEvaluation | undefined;

  if (!evaluationId && !requestRef) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Signatory matrix</CardTitle>
          <CardDescription>
            No request reference or evaluation id on this loan — matrix status unavailable.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Signatory matrix</CardTitle>
        </CardHeader>
        <CardContent className="pt-5 text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Signatory matrix</CardTitle>
          <CardDescription>Could not load matrix evaluation for this request.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <ErrorState onRetry={() => query.refetch()} />
        </CardContent>
      </Card>
    );
  }

  const status = evaluation?.result || evaluation?.status;
  const signatories = evaluation?.requiredSignatories ?? [];

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Signatory matrix</CardTitle>
        <CardDescription>
          Read-only oversight. Approvals are performed by organization signatories, not bank staff.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <dt className="text-muted-foreground">Result</dt>
            <dd className="font-medium">
              {status ? <StatusBadge status={String(status)} /> : "—"}
            </dd>
          </div>
          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <dt className="text-muted-foreground">Authorized</dt>
            <dd className="font-medium">
              {evaluation?.authorized == null ? "—" : evaluation.authorized ? "Yes" : "No"}
            </dd>
          </div>
          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <dt className="text-muted-foreground">Approval type</dt>
            <dd className="font-medium">{evaluation?.approvalType || "—"}</dd>
          </div>
          <div className="grid grid-cols-[130px_1fr] gap-2 text-sm">
            <dt className="text-muted-foreground">Matched rule</dt>
            <dd className="font-medium break-all">{evaluation?.matchedRuleId || "—"}</dd>
          </div>
        </dl>
        {evaluation?.message && (
          <p className="text-sm text-muted-foreground">{String(evaluation.message)}</p>
        )}
        {signatories.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Required signatories</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {signatories.map((s, index) => (
                <li key={s.userId ?? `${index}`}>
                  {[s.firstName, s.lastName].filter(Boolean).join(" ") ||
                    s.username ||
                    s.userId ||
                    `Signatory ${index + 1}`}
                  {s.order != null ? ` (#${s.order})` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LoanRequestList({ orgId }: { orgId: string }) {
  const query = useLoanRequests(orgId, { page: 0, size: 20 });
  const items = asList(query.data);

  if (query.isLoading) return <TableSkeleton rows={5} />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-4">
      {!items.length ? (
        <EmptyState
          title="No loan requests"
          description="Loan requests are created by organization users in the customer portal."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-sky-50/80 hover:bg-sky-50/80">
                <TableHead>Request</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CoopStream</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/organizations/${orgId}/loans/${item.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {item.requestRef || item.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatAmount(item.amount, item.currency)}
                  </TableCell>
                  <TableCell>
                    {item.status ? <StatusBadge status={String(item.status)} /> : "—"}
                  </TableCell>
                  <TableCell>
                    {item.coopStreamStatus ? (
                      <StatusBadge status={String(item.coopStreamStatus)} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function LoanRequestDetail({ orgId, loanId }: { orgId: string; loanId: string }) {
  const query = useLoanRequest(orgId, loanId);
  const enums = useLoanRequestEnums();

  if (query.isLoading) return <TableSkeleton rows={6} />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const loan = query.data;
  const details =
    loan.details && typeof loan.details === "object"
      ? (loan.details as Record<string, unknown>)
      : null;

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Request ID", value: loan.id },
    { label: "Request ref", value: loan.requestRef || "—" },
    { label: "Amount", value: formatAmount(loan.amount, loan.currency) },
    { label: "Currency", value: loan.currency || "—" },
    { label: "Product", value: loan.productCode || loan.productId || "—" },
    { label: "Business type", value: loan.businessType || "—" },
    { label: "Purpose", value: loan.purpose || "—" },
    {
      label: "Status",
      value: loan.status ? <StatusBadge status={String(loan.status)} /> : "—",
    },
    {
      label: "CoopStream",
      value: loan.coopStreamStatus ? (
        <StatusBadge status={String(loan.coopStreamStatus)} />
      ) : (
        "—"
      ),
    },
    { label: "Created", value: formatDate(loan.createdAt) },
    { label: "Submitted", value: formatDate(loan.submittedAt) },
    { label: "Updated", value: formatDate(loan.updatedAt) },
  ];

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <div>
            <CardTitle>Loan request</CardTitle>
            <CardDescription className="mt-1 font-mono text-xs">{loan.id}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[130px_1fr] gap-2 text-sm">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-medium break-all">{row.value}</dd>
              </div>
            ))}
          </dl>
          {details && Object.keys(details).length > 0 && (
            <div className="mt-6 border-t pt-4">
              <p className="mb-3 text-sm font-medium">Details</p>
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {Object.entries(details).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[130px_1fr] gap-2 text-sm">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="font-medium break-all">
                      {typeof value === "string"
                        ? enumLabel(enums.data, key, value)
                        : formatDetailsValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </CardContent>
      </Card>

      <LoanMatrixStatus orgId={orgId} loan={loan} />

      <Link
        href={`/organizations/${orgId}/loans`}
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        Back to list
      </Link>
    </div>
  );
}
