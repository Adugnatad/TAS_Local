"use client";

import { useParams } from "next/navigation";
import { OrganizationUsersPanel } from "@/features/organizations/components/OrganizationUsersPanel";

export default function OrganizationUsersPage() {
  const { id } = useParams<{ id: string }>();
  return <OrganizationUsersPanel orgId={id} />;
}
