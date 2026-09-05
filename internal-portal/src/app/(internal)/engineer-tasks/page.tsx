"use client";

import { RoleGuard } from "@/components/layout/RBACGuard";
import { EngineerTasks } from "@/features/engineer-tasks/components/EngineerTasks";

export default function EngineerTasksPage() {
  return (
    <RoleGuard roles={["BankEngineer"]}>
      <EngineerTasks />
    </RoleGuard>
  );
}
