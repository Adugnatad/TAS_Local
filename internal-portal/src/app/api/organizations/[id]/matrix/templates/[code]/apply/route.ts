import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers(
  (p) => `organizations/${p.id}/matrix/templates/${p.code}/apply`,
  ["POST"],
);
