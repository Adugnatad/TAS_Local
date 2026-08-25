"use client";

import { useParams } from "next/navigation";
import { OrganizationDocumentsPanel } from "@/features/organizations/components/OrganizationDocumentsPanel";

export default function OrganizationDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  return <OrganizationDocumentsPanel orgId={id} />;
}
