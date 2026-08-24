"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import { useRequests } from "../hooks/useRequests";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function RequestListView() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useRequests({
    page,
    pageSize: 10,
    search,
    type: type as "" | "loan" | "trade",
    status: status as "" | "in_progress" | "completed" | "rejected" | "on_hold",
    sortBy: "lastUpdatedAt",
    sortOrder: "desc",
  });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Status Viewer"
        description="Read-only view of loan and trade requests across CoopStream and TSS."
      />

      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="request-search" className="text-muted-foreground">
              Search
            </Label>
            <Input
              id="request-search"
              placeholder="Customer, request ID, or stage"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="sm:max-w-xs"
              aria-label="Search requests"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Type</Label>
            <Select
              value={type || "all"}
              onValueChange={(v) => {
                if (!v) return;
                setType(v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40" aria-label="Filter by type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="trade">Trade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Status</Label>
            <Select
              value={status || "all"}
              onValueChange={(v) => {
                if (!v) return;
                setStatus(v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && <TableSkeleton rows={8} columns={7} />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.data.length === 0 && (
        <EmptyState title="No requests found" description="Try adjusting your search or filters." />
      )}
      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Link
                        href={`/status/${request.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {request.id}
                      </Link>
                    </TableCell>
                    <TableCell>{request.customerName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {request.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.currentStage}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={request.status}
                        label={REQUEST_STATUS_LABELS[request.status]}
                      />
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(request.amount)}</TableCell>
                    <TableCell>{formatDate(request.lastUpdatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2.5">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * data.pageSize + 1}–
              {Math.min(page * data.pageSize, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
