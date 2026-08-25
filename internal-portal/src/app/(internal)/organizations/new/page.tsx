"use client";

import { PermissionGuard } from "@/components/layout/RBACGuard";
import { OrganizationForm } from "@/features/organizations/components/OrganizationForm";

export default function NewOrganizationPage() {
  return (
    <PermissionGuard anyOf={["MANAGE_ORGANIZATIONS"]}>
      <OrganizationForm />
    </PermissionGuard>
  );
}
