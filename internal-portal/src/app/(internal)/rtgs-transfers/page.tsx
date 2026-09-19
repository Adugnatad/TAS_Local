"use client";

import { PermissionGuard } from "@/components/layout/RBACGuard";
import { RtgsAcknowledgementView } from "@/features/rtgs/components/RtgsAcknowledgementView";

export default function RtgsTransfersPage() {
  return (
    <PermissionGuard allOf={["ACKNOWLEDGE_RTGS", "VIEW_ORGANIZATIONS"]}>
      <RtgsAcknowledgementView />
    </PermissionGuard>
  );
}
