import { PermissionGuard } from "@/components/layout/RBACGuard";
import { TradeProcessDetail } from "@/features/trade/components/TradeProcessViews";

export default function TradeDetailPage({
  params,
}: {
  params: { processInstanceId: string };
}) {
  return (
    <PermissionGuard anyOf={["VIEW_ORGANIZATIONS", "MANAGE_ORGANIZATIONS"]}>
      <TradeProcessDetail processInstanceId={decodeURIComponent(params.processInstanceId)} />
    </PermissionGuard>
  );
}
