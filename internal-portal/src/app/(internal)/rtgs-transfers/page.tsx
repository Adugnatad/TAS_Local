"use client";

import { PermissionGuard } from "@/components/layout/RBACGuard";
import { RtgsAcknowledgementView } from "@/features/rtgs/components/RtgsAcknowledgementView";

export default function RtgsTransfersPage() {
  return (
    <PermissionGuard anyOf={["ACKNOWLEDGE_RTGS"]}>
      <RtgsAcknowledgementView />
    </PermissionGuard>
  );
}
