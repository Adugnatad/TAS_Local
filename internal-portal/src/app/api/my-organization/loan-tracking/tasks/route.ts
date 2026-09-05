import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET } = portalHandlers(() => "my-organization/loan-tracking/tasks", ["GET"]);
