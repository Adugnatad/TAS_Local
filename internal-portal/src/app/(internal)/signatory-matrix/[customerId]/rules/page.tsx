"use client";

import { useParams } from "next/navigation";
import { SignatoryRulesList } from "@/features/signatory-matrix/components/SignatoryRulesList";

export default function RulesPage() {
  const params = useParams();
  return <SignatoryRulesList customerId={String(params.customerId)} />;
}
