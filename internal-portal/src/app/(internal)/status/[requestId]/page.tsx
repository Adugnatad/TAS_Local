import { PermissionGuard } from "@/components/layout/RBACGuard";
import { LoanProcessDetail } from "@/features/status-viewer/components/LoanProcessViews";

export default function StatusDetailPage({ params }: { params: { requestId: string } }) {
  return (
    <PermissionGuard anyOf={["VIEW_ORGANIZATIONS", "MANAGE_ORGANIZATIONS"]}>
      <LoanProcessDetail applicationId={decodeURIComponent(params.requestId)} />
    </PermissionGuard>
  );
}
