"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Ban, RefreshCw } from "lucide-react";
import { PermissionGate } from "@/components/layout/RBACGuard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deactivateLoanProcess,
  fetchLoanProcess,
  fetchLoanProcessStatus,
  fetchLoanProcesses,
  loanProcessId,
  loanProcessRows,
} from "../loan-process-api";
import type { LoanProcess } from "../loan-process-types";

function value(process: LoanProcess, ...keys: string[]) {
  for (const key of keys) {
    const item = process[key];
    if (item !== undefined && item !== null && item !== "") return String(item);
  }
  return "—";
}

function date(valueToFormat: unknown) {
  if (!valueToFormat) return "—";
  const parsed = new Date(String(valueToFormat));
  return Number.isNaN(parsed.getTime()) ? String(valueToFormat) : parsed.toLocaleString();
}

function processStatus(process: LoanProcess) {
  return value(process, "status", "processStatus", "state");
}

export function LoanProcessList() {
  const query = useQuery({ queryKey: ["loan-processes"], queryFn: fetchLoanProcesses });
  const rows = loanProcessRows(query.data).filter((item) => loanProcessId(item));

  if (query.isLoading) return <TableSkeleton rows={8} />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
            CoopStream
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Loan process oversight</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-mostly view of customer loan processes.
          </p>
        </div>
        <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
          <RefreshCw className={query.isFetching ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>
      {query.isError && (
        <Alert variant="destructive">
          <AlertDescription>CoopStream could not be reached.</AlertDescription>
        </Alert>
      )}
      {!rows.length ? (
        <EmptyState
          title="No loan processes"
          description="No CoopStream loan processes were returned."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((process) => {
                const id = loanProcessId(process);
                return (
                  <TableRow key={id}>
                    <TableCell>
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={`/status/${encodeURIComponent(id)}`}
                      >
                        {id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {value(
                        process,
                        "customerName",
                        "organizationName",
                        "customer",
                        "borrowerName",
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={processStatus(process)} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {date(process.createdAt ?? process["created"])}{" "}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {date(process.updatedAt ?? process["lastUpdated"])}{" "}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function LoanProcessDetail({ applicationId }: { applicationId: string }) {
  const queryClient = useQueryClient();
  const detail = useQuery({
    queryKey: ["loan-process", applicationId],
    queryFn: () => fetchLoanProcess(applicationId),
  });
  const status = useQuery({
    queryKey: ["loan-process-status", applicationId],
    queryFn: () => fetchLoanProcessStatus(applicationId),
  });
  const [message, setMessage] = useState<string | null>(null);
  const deactivate = useMutation({
    mutationFn: () => deactivateLoanProcess(applicationId),
    onSuccess: async () => {
      setMessage("Loan process suspended.");
      await Promise.all([
        detail.refetch(),
        status.refetch(),
        queryClient.invalidateQueries({ queryKey: ["loan-processes"] }),
      ]);
    },
    onError: (error) =>
      setMessage(error instanceof Error ? error.message : "Could not suspend loan process."),
  });

  if (detail.isLoading || status.isLoading) return <TableSkeleton rows={6} />;
  if (detail.isError || status.isError)
    return (
      <ErrorState
        onRetry={() => {
          void detail.refetch();
          void status.refetch();
        }}
      />
    );

  const process = detail.data;
  if (!process)
    return (
      <EmptyState
        title="Loan process unavailable"
        description="CoopStream returned no process details."
      />
    );
  const statusData = status.data;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/status"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to loan processes
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">CoopStream application</p>
          <h1 className="mt-1 break-all text-2xl font-semibold tracking-tight">{applicationId}</h1>
          <div className="mt-2">
            <StatusBadge status={processStatus(process)} />
          </div>
        </div>
        <PermissionGate anyOf={["MANAGE_ORGANIZATIONS"]}>
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm("Suspend this loan process?")) deactivate.mutate();
            }}
            disabled={deactivate.isPending}
          >
            <Ban /> {deactivate.isPending ? "Suspending..." : "Suspend process"}
          </Button>
        </PermissionGate>
      </div>
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Process details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {Object.entries(process)
              .filter(([, item]) => typeof item !== "object")
              .map(([key, item]) => (
                <div key={key}>
                  <dt className="text-sm text-muted-foreground">
                    {key.replaceAll(/([A-Z])/g, " $1")}
                  </dt>
                  <dd className="mt-1 break-all font-medium">{String(item ?? "—")}</dd>
                </div>
              ))}
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Current status</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify(statusData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
