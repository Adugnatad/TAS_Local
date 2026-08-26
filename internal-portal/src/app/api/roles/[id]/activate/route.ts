import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers((p) => `roles/${p.id}/activate`, ['POST']);
