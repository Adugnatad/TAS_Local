"use client";

import { useParams } from "next/navigation";
import { PermissionGuard } from "@/components/layout/RBACGuard";
import { LoanRequestCreate } from "@/features/loan-requests/components/LoanRequestViews";

export default function NewLoanPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <PermissionGuard anyOf={["MANAGE_ORGANIZATIONS"]}>
      <LoanRequestCreate orgId={id} />
    </PermissionGuard>
  );
}
