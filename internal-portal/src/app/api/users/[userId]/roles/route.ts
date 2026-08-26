import { portalHandlers } from "@/app/api/_lib/portal";

export const { PUT } = portalHandlers((p) => `users/${p.userId}/roles`, ['PUT']);
