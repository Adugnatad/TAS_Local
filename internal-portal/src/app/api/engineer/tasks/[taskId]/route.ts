import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET } = portalHandlers((p) => `engineer/tasks/${p.taskId}`, ["GET"]);
