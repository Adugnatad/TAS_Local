"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { ONBOARDING_STATUS_LABELS } from "@/lib/constants";
import { useCustomers } from "../hooks/useCustomers";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CustomerListView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useCustomers({
    page,
    pageSize: 10,
    search,
    status: status as "" | "draft" | "pending_review" | "approved" | "rejected",
  });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Onboarding"
        description="Manage corporate customer profiles and onboarding status."
        actions={
          <Link href="/onboarding/new" className={cn(buttonVariants())}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New Organization
          </Link>
        }
      />

      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="customer-search" className="text-muted-foreground">
              Search
            </Label>
            <Input
              id="customer-search"
              placeholder="Name, TIN, phone, or CRM ID"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="sm:max-w-md"
              aria-label="Search customers"
            />
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && <TableSkeleton rows={8} columns={5} />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.data.length === 0 && (
        <EmptyState
          title="No organizations found"
          description="Create a new organization profile to get started."
          action={
            <Link href="/onboarding/new" className={cn(buttonVariants())}>
              New Organization
            </Link>
          }
        />
      )}
      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Primary Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        href={`/onboarding/${customer.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      {customer.accounts.find((account) => account.isPrimary)?.accountNumber ?? "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={customer.onboardingStatus}
                        label={ONBOARDING_STATUS_LABELS[customer.onboardingStatus]}
                      />
                    </TableCell>
                    <TableCell>{formatDate(customer.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2.5">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * data.pageSize + 1}–{Math.min(page * data.pageSize, data.total)}{" "}
              of {data.total}
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
