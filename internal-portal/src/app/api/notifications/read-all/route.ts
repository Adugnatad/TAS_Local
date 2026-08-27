import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers(() => "notifications/read-all", ["POST"]);
