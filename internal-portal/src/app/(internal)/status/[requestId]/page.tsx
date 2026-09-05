import { PermissionGuard, RoleGuard } from "@/components/layout/RBACGuard";
import { LoanProcessDetail } from "@/features/status-viewer/components/LoanProcessViews";

export default function StatusDetailPage({ params }: { params: { requestId: string } }) {
  return (
    <RoleGuard roles={["admin", "ADMIN", "Admin", "BankAdmin"]}>
      <PermissionGuard anyOf={["VIEW_ORGANIZATIONS", "MANAGE_ORGANIZATIONS"]}>
        <LoanProcessDetail applicationId={decodeURIComponent(params.requestId)} />
      </PermissionGuard>
    </RoleGuard>
  );
}
