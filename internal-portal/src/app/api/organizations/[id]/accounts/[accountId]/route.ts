import { portalHandlers } from "@/app/api/_lib/portal";

export const { DELETE } = portalHandlers(
  (p) => `organizations/${p.id}/accounts/${p.accountId}`,
  ["DELETE"],
);
