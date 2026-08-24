"use client";

import { useParams } from "next/navigation";
import { MatrixPreview } from "@/features/signatory-matrix/components/MatrixPreview";

export default function PreviewPage() {
  const params = useParams();
  return <MatrixPreview customerId={String(params.customerId)} />;
}
