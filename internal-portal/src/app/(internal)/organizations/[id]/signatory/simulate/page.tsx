"use client";

import { useParams } from "next/navigation";
import { MatrixSimulatePanel } from "@/features/signatory-matrix/components/MatrixSimulatePanel";

export default function SignatorySimulatePage() {
  const { id } = useParams<{ id: string }>();
  return <MatrixSimulatePanel orgId={id} />;
}
