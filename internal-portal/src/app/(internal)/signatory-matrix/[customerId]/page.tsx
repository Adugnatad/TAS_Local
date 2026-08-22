"use client";

import { useParams } from "next/navigation";
import { useCustomer } from "@/features/onboarding/hooks/useCustomers";
import { SignatoryList } from "@/features/signatory-matrix/components/SignatoryList";
import { SignatoryRulesList } from "@/features/signatory-matrix/components/SignatoryRulesList";
import { MatrixPreview } from "@/features/signatory-matrix/components/MatrixPreview";
import { Breadcrumbs } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SignatoryMatrixDetailPage() {
  const params = useParams();
  const customerId = String(params.customerId);
  const { data: customer, isLoading, isError, refetch } = useCustomer(customerId);

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
          <div>
            <h1 className="text-2xl font-bold">{customer.legalName}</h1>
            <p className="text-muted-foreground">{customer.registrationNumber}</p>
          </div>

          <Tabs defaultValue="signatories">
            <TabsList>
              <TabsTrigger value="signatories">Signatories</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="preview">Matrix Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="signatories" className="mt-6">
              <SignatoryList customerId={customerId} />
            </TabsContent>
            <TabsContent value="rules" className="mt-6">
              <SignatoryRulesList customerId={customerId} />
            </TabsContent>
            <TabsContent value="preview" className="mt-6">
              <MatrixPreview customerId={customerId} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
