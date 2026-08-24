"use client";

import { useState } from "react";
import Link from "next/link";
import { useCustomers } from "@/features/onboarding/hooks/useCustomers";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent } from "@/components/ui/card";

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

      <Card>
        <CardContent className="pt-5">
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor="matrix-customer-search" className="text-muted-foreground">
              Search
            </Label>
            <Input
              id="matrix-customer-search"
              placeholder="Legal name or industry"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search customers"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading && <TableSkeleton rows={6} columns={3} />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.data.length === 0 && (
        <EmptyState
          title="No approved customers"
          description="Customers must be approved through onboarding before configuring signatory rules."
        />
      )}
      {!isLoading && !isError && data && data.data.length > 0 && (
        <Card className="overflow-hidden py-0">
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
        </Card>
      )}
    </div>
  );
}
