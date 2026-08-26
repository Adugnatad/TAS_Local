import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET, POST } = portalHandlers(() => 'roles', ['GET', 'POST']);
