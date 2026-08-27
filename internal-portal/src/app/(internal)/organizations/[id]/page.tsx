"use client";

import { useParams } from "next/navigation";
import { OrganizationOverview } from "@/features/organizations/components/OrganizationOverview";

export default function OrganizationOverviewPage() {
  const { id } = useParams<{ id: string }>();
  return <OrganizationOverview orgId={id} />;
}
