"use client";

import { RBACGuard } from "@/components/layout/RBACGuard";
import { RolePermissionsMatrix } from "@/features/settings/components/RolePermissionsMatrix";

export default function RolesSettingsPage() {
  return (
    <RBACGuard allowedRoles={["admin"]}>
      <RolePermissionsMatrix />
    </RBACGuard>
  );
}
