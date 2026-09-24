import { PermissionGuard } from "@/components/layout/RBACGuard";
import { TradeProcessList } from "@/features/trade/components/TradeProcessViews";

export default function TradePage() {
  return (
    <PermissionGuard anyOf={["VIEW_ORGANIZATIONS", "MANAGE_ORGANIZATIONS"]}>
      <TradeProcessList />
    </PermissionGuard>
  );
}
