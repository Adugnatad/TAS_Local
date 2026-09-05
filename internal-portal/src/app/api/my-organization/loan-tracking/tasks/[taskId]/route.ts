import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET } = portalHandlers(
  ({ taskId }) => `my-organization/loan-tracking/tasks/${taskId}`,
  ["GET"],
);
