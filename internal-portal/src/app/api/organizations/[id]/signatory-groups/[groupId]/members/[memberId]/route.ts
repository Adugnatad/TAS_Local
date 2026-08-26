import { portalHandlers } from "@/app/api/_lib/portal";

export const { DELETE } = portalHandlers((p) => `organizations/${p.id}/signatory-groups/${p.groupId}/members/${p.memberId}`, ['DELETE']);
