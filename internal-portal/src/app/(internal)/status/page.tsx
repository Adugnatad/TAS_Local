import { PermissionGuard } from "@/components/layout/RBACGuard";
import { LoanProcessList } from "@/features/status-viewer/components/LoanProcessViews";

export default function StatusPage() {
  return (
    <PermissionGuard anyOf={["VIEW_ORGANIZATIONS", "MANAGE_ORGANIZATIONS"]}>
      <LoanProcessList />
    </PermissionGuard>
  );
}
