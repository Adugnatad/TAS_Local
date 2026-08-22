"use client";

import { useState } from "react";
import Link from "next/link";
import { useCustomers } from "@/features/onboarding/hooks/useCustomers";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ONBOARDING_STATUS_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function SignatoryMatrixCustomerPicker() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useCustomers({
    page: 1,
    pageSize: 20,
    search,
    status: "approved",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Signatory Matrix"
        description="Configure signatories and approval rules per corporate customer."
      />

      <Input
        placeholder="Search approved customers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
        aria-label="Search customers"
      />

      {isLoading && <TableSkeleton rows={6} columns={3} />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.data.length === 0 && (
        <EmptyState
          title="No approved customers"
          description="Customers must be approved through onboarding before configuring signatory rules."
        />
      )}
      {!isLoading && !isError && data && data.data.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link
                      href={`/signatory-matrix/${customer.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {customer.legalName}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.industry}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={customer.onboardingStatus}
                      label={ONBOARDING_STATUS_LABELS[customer.onboardingStatus]}
                    />
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
