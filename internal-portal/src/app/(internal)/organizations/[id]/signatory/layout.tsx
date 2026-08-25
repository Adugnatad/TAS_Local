"use client";

import { PermissionGuard } from "@/components/layout/RBACGuard";

export default function SignatoryLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGuard anyOf={["MANAGE_SIGNATORY_ANY"]}>{children}</PermissionGuard>;
}
