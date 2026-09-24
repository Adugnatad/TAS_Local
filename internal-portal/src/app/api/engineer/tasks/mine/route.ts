import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET } = portalHandlers(() => "engineer/tasks/mine", ["GET"]);
