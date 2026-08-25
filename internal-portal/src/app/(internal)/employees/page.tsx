"use client";

import { PermissionGuard } from "@/components/layout/RBACGuard";
import { EmployeeDirectory } from "@/features/employees/components/EmployeeDirectory";

export default function EmployeesPage() {
  return (
    <PermissionGuard anyOf={["MANAGE_EMPLOYEES"]}>
      <EmployeeDirectory />
    </PermissionGuard>
  );
}
