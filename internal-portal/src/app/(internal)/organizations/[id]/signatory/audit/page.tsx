"use client";

import { useParams } from "next/navigation";
import { MatrixAuditPanel } from "@/features/signatory-matrix/components/MatrixAuditPanel";

export default function SignatoryAuditPage() {
  const { id } = useParams<{ id: string }>();
  return <MatrixAuditPanel orgId={id} />;
}
