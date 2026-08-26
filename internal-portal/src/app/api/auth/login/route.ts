import { portalHandlers } from "@/app/api/_lib/portal";

export const { POST } = portalHandlers(() => 'auth/login', ['POST']);
