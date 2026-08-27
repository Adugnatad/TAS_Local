import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET, POST } = portalHandlers(() => 'employees', ['GET', 'POST']);
