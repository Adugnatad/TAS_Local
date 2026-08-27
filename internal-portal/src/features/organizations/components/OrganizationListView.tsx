"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";
import { MoreVertical, Plus } from "lucide-react";
import { useOrganizations } from "../hooks";
import { useSession } from "@/features/auth/hooks/useSession";
import { ORG_STATUSES, type OrgStatus } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    const date = value.includes("T") ? parseISO(value) : new Date(value);
    return isValid(date) ? format(date, "MMM d, yyyy") : value;
  } catch {
    return value;
  }
}

function customerId(org: {
  cbsCustomerId?: string | null;
  crmSystemId?: string | null;
  tin: string | null;
}) {
  return org.cbsCustomerId || org.crmSystemId || org.tin || "—";
}

export function OrganizationListView() {
  const { can } = useSession();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrgStatus | "">("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const queryStatus = activeOnly ? "ACTIVE" : status;
  const query = useOrganizations({ q, status: queryStatus, page, size });

  const rows = useMemo(() => query.data?.content ?? [], [query.data?.content]);

  return (
    <div className="space-y-6">
      <Alert className="border-sky-200 bg-sky-50 text-sky-950">
        <AlertDescription>
          View and filter contracts by status. Use &apos;Active only&apos; to show active contracts.
          Create new contracts by linking a customer account (13-digit account number).
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Contracts List</h1>
        {can("MANAGE_ORGANIZATIONS") && (
          <Link href="/organizations/new" className={cn(buttonVariants())}>
            <Plus className="size-4" />
            Create contract
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <Input
          placeholder="Global search..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          className="lg:max-w-xs"
        />
        <Select
          value={activeOnly ? "ACTIVE" : status || "ALL"}
          onValueChange={(value) => {
            if (!value) return;
            setActiveOnly(false);
            setStatus(value === "ALL" ? "" : (value as OrgStatus));
            setPage(0);
          }}
          disabled={activeOnly}
        >
          <SelectTrigger className="lg:w-48" aria-label="Status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ORG_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            checked={activeOnly}
            onChange={(e) => {
              setActiveOnly(e.target.checked);
              setPage(0);
            }}
          />
          <span>Active only</span>
        </label>

        <div className="lg:ml-auto">
          <Label className="sr-only" htmlFor="page-size">
            Per page
          </Label>
          <Select
            value={String(size)}
            onValueChange={(value) => {
              if (!value) return;
              setSize(Number(value));
              setPage(0);
            }}
          >
            <SelectTrigger id="page-size" className="w-36" aria-label="Per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} per page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={8} />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !rows.length ? (
        <EmptyState title="No contracts" description="Create a contract to get started." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-sky-50/80 hover:bg-sky-50/80">
                  <TableHead>Contract Name</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Active Users</TableHead>
                  <TableHead>Accounts</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link
                        href={`/organizations/${org.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">{customerId(org)}</TableCell>
                    <TableCell>
                      <StatusBadge status={org.status} />
                    </TableCell>
                    <TableCell>{formatDate(org.effectiveDate)}</TableCell>
                    <TableCell>{formatDate(org.expiryDate)}</TableCell>
                    <TableCell>{org.activeUsers ?? "—"}</TableCell>
                    <TableCell>{org.accounts}</TableCell>
                    <TableCell>{formatDate(org.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label="Row actions" />
                          }
                        >
                          <MoreVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={<Link href={`/organizations/${org.id}`} />}
                          >
                            Open
                          </DropdownMenuItem>
                          {can("MANAGE_ORGANIZATIONS") && (
                            <DropdownMenuItem
                              render={<Link href={`/organizations/${org.id}/edit`} />}
                            >
                              Edit
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <span>
              Page {(query.data?.page ?? 0) + 1} of {Math.max(query.data?.totalPages ?? 1, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={query.data?.page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={query.data?.last}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
