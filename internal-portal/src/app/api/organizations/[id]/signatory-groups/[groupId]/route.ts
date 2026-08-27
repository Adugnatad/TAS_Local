import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET, PUT } = portalHandlers(
  (p) => `organizations/${p.id}/signatory-groups/${p.groupId}`,
  ["GET", "PUT"],
);
