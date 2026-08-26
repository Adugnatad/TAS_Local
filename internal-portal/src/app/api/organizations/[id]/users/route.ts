import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET, POST } = portalHandlers((p) => `organizations/${p.id}/users`, ['GET', 'POST']);
