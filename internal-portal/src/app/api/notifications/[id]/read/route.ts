import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers((p) => `notifications/${p.id}/read`, ["POST"]);
