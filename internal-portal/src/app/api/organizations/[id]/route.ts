import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET, PUT, DELETE } = portalHandlers((p) => `organizations/${p.id}`, ['GET', 'PUT', 'DELETE']);
