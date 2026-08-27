"use client";

import { useParams } from "next/navigation";
import { LoanRequestDetail } from "@/features/loan-requests/components/LoanRequestViews";

export default function LoanDetailPage() {
  const { id, loanId } = useParams<{ id: string; loanId: string }>();
  return <LoanRequestDetail orgId={id} loanId={loanId} />;
}
