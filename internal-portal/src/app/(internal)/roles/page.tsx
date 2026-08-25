"use client";

import { PermissionGuard } from "@/components/layout/RBACGuard";
import { RolesAdmin } from "@/features/roles/components/RolesAdmin";

export default function RolesPage() {
  return (
    <PermissionGuard
      anyOf={["MANAGE_ROLES", "MANAGE_PERMISSIONS", "MANAGE_EMPLOYEES", "MANAGE_ORGANIZATIONS"]}
    >
      <RolesAdmin />
    </PermissionGuard>
  );
}
