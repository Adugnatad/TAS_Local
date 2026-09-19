import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers((p) => `rtgs/transfers/${p.id}/acknowledge`, ["POST"]);
