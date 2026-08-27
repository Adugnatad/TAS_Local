import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET, PUT } = portalHandlers((p) => `roles/${p.id}`, ['GET', 'PUT']);
