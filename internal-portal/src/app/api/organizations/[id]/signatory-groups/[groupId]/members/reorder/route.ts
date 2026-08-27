import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers((p) => `organizations/${p.id}/signatory-groups/${p.groupId}/members/reorder`, ['POST']);
