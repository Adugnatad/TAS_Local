import { portalHandlers } from "@/app/api/_lib/portal";

export const { PUT } = portalHandlers((p) => `organizations/${p.id}/signatory-groups/${p.groupId}`, ['PUT']);
