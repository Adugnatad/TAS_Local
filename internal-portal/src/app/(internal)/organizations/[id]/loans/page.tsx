"use client";

import { useParams } from "next/navigation";
import { LoanRequestList } from "@/features/loan-requests/components/LoanRequestViews";

export default function OrganizationLoansPage() {
  const { id } = useParams<{ id: string }>();
  return <LoanRequestList orgId={id} />;
}
