import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET } = portalHandlers(
  ({ coopstreamApplicationId }) => `loans/processes/${coopstreamApplicationId}/status`,
  ["GET"],
);
