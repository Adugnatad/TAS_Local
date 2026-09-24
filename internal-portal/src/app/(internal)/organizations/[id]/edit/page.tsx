"use client";

import { useParams } from "next/navigation";
import { OrganizationForm } from "@/features/organizations/components/OrganizationForm";
import { useOrganization } from "@/features/organizations/hooks";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGuard } from "@/components/layout/RBACGuard";

export default function EditOrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const query = useOrganization(id);

  if (query.isLoading) return <Skeleton className="h-64 w-full" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  if (query.data.status === "TERMINATED") {
    return (
      <p className="text-sm text-muted-foreground">
        This organization is terminated and cannot be edited.
      </p>
    );
  }

  return (
    <PermissionGuard anyOf={["MANAGE_ORGANIZATIONS"]}>
      <OrganizationForm organization={query.data} embedded />
    </PermissionGuard>
  );
}
