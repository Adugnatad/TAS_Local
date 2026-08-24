"use client";

import { useParams } from "next/navigation";
import { SignatoryList } from "@/features/signatory-matrix/components/SignatoryList";

export default function SignatoriesPage() {
  const params = useParams();
  return <SignatoryList customerId={String(params.customerId)} />;
}
