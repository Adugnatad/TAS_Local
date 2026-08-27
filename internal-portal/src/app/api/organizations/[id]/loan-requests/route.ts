import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET } = portalHandlers((p) => `organizations/${p.id}/loan-requests`, ["GET"]);
