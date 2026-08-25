"use client";

import { useParams } from "next/navigation";
import { ContractDetailShell } from "@/features/organizations/components/ContractDetailShell";
import { PermissionGuard } from "@/components/layout/RBACGuard";

export default function OrganizationSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const orgId = params.id;

  return (
    <PermissionGuard anyOf={["VIEW_ORGANIZATIONS", "MANAGE_ORGANIZATIONS"]}>
      <ContractDetailShell orgId={orgId}>{children}</ContractDetailShell>
    </PermissionGuard>
  );
}
