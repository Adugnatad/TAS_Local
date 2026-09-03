import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers(
  (params) => `organizations/${params.id}/accounts/refresh`,
  ["POST"],
);
