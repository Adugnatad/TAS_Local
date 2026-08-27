import { portalHandlers } from "@/app/api/_lib/portal";

export const { PUT } = portalHandlers((p) => `organizations/${p.id}/approval-rules/${p.ruleId}`, ['PUT']);
