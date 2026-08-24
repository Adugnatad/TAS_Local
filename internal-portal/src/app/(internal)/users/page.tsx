"use client";

import { RBACGuard } from "@/components/layout/RBACGuard";
import { UserManagement } from "@/features/settings/components/UserManagement";

export default function UsersPage() {
  return (
    <RBACGuard allowedRoles={["admin"]}>
      <UserManagement />
    </RBACGuard>
  );
}
