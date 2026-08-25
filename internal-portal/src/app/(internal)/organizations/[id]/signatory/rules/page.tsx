"use client";

import { useParams } from "next/navigation";
import { SignatoryRulesPanel } from "@/features/signatory-matrix/components/SignatoryRulesPanel";

export default function SignatoryRulesPage() {
  const { id } = useParams<{ id: string }>();
  return <SignatoryRulesPanel orgId={id} />;
}
