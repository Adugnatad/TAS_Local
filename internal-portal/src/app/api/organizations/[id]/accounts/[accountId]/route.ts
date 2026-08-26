import { portalHandlers } from "@/app/api/_lib/portal";

export const { PUT, DELETE } = portalHandlers((p) => `organizations/${p.id}/accounts/${p.accountId}`, ['PUT', 'DELETE']);
