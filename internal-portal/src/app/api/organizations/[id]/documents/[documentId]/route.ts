import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET, DELETE } = portalHandlers((p) => `organizations/${p.id}/documents/${p.documentId}`, ['GET', 'DELETE']);
