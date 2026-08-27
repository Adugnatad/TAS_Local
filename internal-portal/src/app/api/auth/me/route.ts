import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET } = portalHandlers(() => 'auth/me', ['GET']);
