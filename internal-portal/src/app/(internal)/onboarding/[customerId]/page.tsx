"use client";

import { useParams } from "next/navigation";
import { CustomerForm } from "@/features/onboarding/components/CustomerForm";
import { useCustomer } from "@/features/onboarding/hooks/useCustomers";
import { Breadcrumbs } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = String(params.customerId);
  const isNew = customerId === "new";

  const { data: customer, isLoading, isError, refetch } = useCustomer(
    isNew ? "" : customerId,
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Onboarding", href: "/onboarding" },
          { label: isNew ? "New Customer" : customer?.legalName ?? customerId },
        ]}
      />
      {isNew && <CustomerForm />}
      {!isNew && isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}
      {!isNew && isError && <ErrorState onRetry={() => refetch()} />}
      {!isNew && customer && <CustomerForm customer={customer} />}
    </div>
  );
}
