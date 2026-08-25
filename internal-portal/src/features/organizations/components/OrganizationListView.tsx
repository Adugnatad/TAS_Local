"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrganizations } from "../hooks";
import { tinVerificationLabel } from "../tin";
import { useSession } from "@/features/auth/hooks/useSession";
import { ORG_STATUSES, type OrgStatus } from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function OrganizationListView() {
  const { can } = useSession();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrgStatus | "">("");
  const [page, setPage] = useState(0);
  const query = useOrganizations({ q, status, page, size: 20 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Contracts list — onboard and manage corporate customers."
        actions={
          can("MANAGE_ORGANIZATIONS") ? (
            <Link href="/organizations/new" className={cn(buttonVariants())}>
              Register organization
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search name, TIN, CRM id"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          className="sm:max-w-sm"
        />
        <Select
          value={status || "ALL"}
          onValueChange={(value) => {
            if (!value) return;
            setStatus(value === "ALL" ? "" : (value as OrgStatus));
            setPage(0);
          }}
        >
          <SelectTrigger className="sm:w-48" aria-label="Status">
            <SelectValue placeholder="Status" />
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
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={8} />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data?.content.length ? (
        <EmptyState title="No organizations" description="Register a company to get started." />
      ) : (
        <>
          <div className="rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>TIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>TIN validation</TableHead>
                  <TableHead>Accounts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.content.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link href={`/organizations/${org.id}`} className="font-medium hover:underline">
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell>{org.tin ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={org.status} />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const tin = tinVerificationLabel(org);
                        return <StatusBadge status={tin.status} label={tin.label} />;
                      })()}
                    </TableCell>
                    <TableCell>{org.accounts}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <span>
              Page {query.data.page + 1} of {Math.max(query.data.totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={query.data.page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={query.data.last}
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
