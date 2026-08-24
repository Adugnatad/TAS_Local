"use client";

import { useParams } from "next/navigation";
import { useCustomer } from "@/features/onboarding/hooks/useCustomers";
import { Breadcrumbs } from "@/components/layout/PageHeader";
import { RouteTabs } from "@/components/layout/RouteTabs";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerMatrixLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const customerId = String(params.customerId);
  const { data: customer, isLoading, isError, refetch } = useCustomer(customerId);
  const base = `/signatory-matrix/${customerId}`;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Signatory Matrix", href: "/signatory-matrix" },
          { label: customer?.legalName ?? customerId },
        ]}
      />

      {isLoading && <Skeleton className="h-8 w-64" />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {customer && (
        <>
          <div className="border-b border-border/70 pb-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              COOP
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{customer.legalName}</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {customer.registrationNumber}
            </p>
          </div>
          <RouteTabs
            items={[
              { href: `${base}/signatories`, label: "Signatories" },
              { href: `${base}/rules`, label: "Rules" },
              { href: `${base}/preview`, label: "Matrix Preview" },
            ]}
          />
        </>
      )}
      {children}
    </div>
  );
}
