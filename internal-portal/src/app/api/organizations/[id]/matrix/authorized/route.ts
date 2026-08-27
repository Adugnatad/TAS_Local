import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET } = portalHandlers((p) => `organizations/${p.id}/matrix/authorized`, ['GET']);
