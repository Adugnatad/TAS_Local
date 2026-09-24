import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers((p) => `engineer/tasks/${p.taskId}/complete`, ["POST"]);
