import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers(
  ({ coopstreamApplicationId }) => `loans/processes/${coopstreamApplicationId}/deactivate`,
  ["POST"],
);
