import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers(
  (p) => `organizations/${p.id}/accounts/${p.accountId}/deselect`,
  ["POST"],
);
