import { portalHandlers } from "@/app/api/_lib/portal";

export const { PUT, DELETE } = portalHandlers(
  (p) => `organizations/${p.id}/approval-rules/${p.ruleId}`,
  ["PUT", "DELETE"],
);
