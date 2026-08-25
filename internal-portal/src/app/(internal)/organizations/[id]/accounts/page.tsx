"use client";

import { useParams } from "next/navigation";
import { OrganizationAccountsPanel } from "@/features/organizations/components/OrganizationAccountsPanel";

export default function OrganizationAccountsPage() {
  const { id } = useParams<{ id: string }>();
  return <OrganizationAccountsPanel orgId={id} />;
}
