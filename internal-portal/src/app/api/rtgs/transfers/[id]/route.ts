import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET } = portalHandlers((p) => `rtgs/transfers/${p.id}`, ["GET"]);
