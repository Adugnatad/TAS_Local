"use client";

import { useParams } from "next/navigation";
import { SignatoryGroupsPanel } from "@/features/signatory-matrix/components/SignatoryGroupsPanel";

export default function SignatoryGroupsPage() {
  const { id } = useParams<{ id: string }>();
  return <SignatoryGroupsPanel orgId={id} />;
}
