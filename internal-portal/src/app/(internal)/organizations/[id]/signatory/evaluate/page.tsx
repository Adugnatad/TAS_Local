"use client";

import { useParams } from "next/navigation";
import { SignatoryEvaluatePanel } from "@/features/signatory-matrix/components/SignatoryEvaluatePanel";

export default function SignatoryEvaluatePage() {
  const { id } = useParams<{ id: string }>();
  return <SignatoryEvaluatePanel orgId={id} />;
}
