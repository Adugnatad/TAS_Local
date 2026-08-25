"use client";

import { PermissionGuard } from "@/components/layout/RBACGuard";
import { OrganizationListView } from "@/features/organizations/components/OrganizationListView";

export default function OrganizationsPage() {
  return (
    <PermissionGuard anyOf={["VIEW_ORGANIZATIONS", "MANAGE_ORGANIZATIONS"]}>
      <OrganizationListView />
    </PermissionGuard>
  );
}
