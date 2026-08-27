import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers((p) => `organizations/${p.id}/approval-rules/${p.ruleId}/deactivate`, ['POST']);
