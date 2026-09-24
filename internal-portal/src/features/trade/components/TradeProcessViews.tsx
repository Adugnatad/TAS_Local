"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useSession } from "@/features/auth/hooks/useSession";
import type { PageResponse } from "@/types/global";
import type { TradeProcess } from "../types";
import { useCseTradeProcesses, useTradeFxOptions, useTradeProcess, useTradeProcesses } from "../hooks";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
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

function asList(data: PageResponse<TradeProcess> | TradeProcess[] | undefined): TradeProcess[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.content;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export function TradeProcessList() {
  const { user } = useSession();
  const isCse = user?.roles?.includes("BankCSE") ?? false;
  const [page, setPage] = useState(0);
  const allQuery = useTradeProcesses({ page, size: 20 });
  const cseQuery = useCseTradeProcesses(user?.email ?? undefined, isCse);
  const query = isCse ? cseQuery : allQuery;
  const rows = isCse ? (cseQuery.data ?? []) : asList(allQuery.data);
  const totalPages =
    !isCse && allQuery.data && !Array.isArray(allQuery.data) ? allQuery.data.totalPages : 1;

  if (query.isLoading) return <TableSkeleton rows={8} />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
            CoopStream
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Trade oversight</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isCse
              ? "Trade requests currently assigned to you."
              : "In-flight customer trade requests across organizations."}
          </p>
        </div>
        <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
          <RefreshCw className={query.isFetching ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {!rows.length ? (
        <EmptyState title="No trade processes" description="No trade requests were returned." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((process) => (
                <TableRow key={process.processInstanceId}>
                  <TableCell>
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={`/trade/${encodeURIComponent(process.processInstanceId)}`}
                    >
                      {process.processInstanceId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {process.customerName || process.organizationName || "—"}
                  </TableCell>
                  <TableCell>
                    {process.status ? <StatusBadge status={process.status} /> : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(process.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(process.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isCse && totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export function TradeProcessDetail({ processInstanceId }: { processInstanceId: string }) {
  const query = useTradeProcess(processInstanceId);
  const fx = useTradeFxOptions();

  if (query.isLoading) return <TableSkeleton rows={6} />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const process = query.data;
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Link
        href="/trade"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to trade processes
      </Link>
      <div>
        <p className="text-sm text-muted-foreground">Trade process</p>
        <h1 className="mt-1 break-all text-2xl font-semibold tracking-tight">
          {process.processInstanceId}
        </h1>
        {process.status && (
          <div className="mt-2">
            <StatusBadge status={process.status} />
          </div>
        )}
      </div>
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
      {fx.data != null && (
        <Card>
          <CardHeader>
            <CardTitle>FX options</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-72 overflow-auto rounded-md bg-muted p-4 text-xs">
              {JSON.stringify(fx.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
