import { portalHandlers } from "@/app/api/_lib/portal";

export const { GET } = portalHandlers(() => "rtgs/transfers/awaiting-acknowledgement", ["GET"]);
