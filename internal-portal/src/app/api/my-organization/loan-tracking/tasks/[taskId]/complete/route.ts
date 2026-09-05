import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers(
  ({ taskId }) => `my-organization/loan-tracking/tasks/${taskId}/complete`,
  ["POST"],
);
