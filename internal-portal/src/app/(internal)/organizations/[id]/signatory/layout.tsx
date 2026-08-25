"use client";

import { useParams } from "next/navigation";
import { RouteTabs } from "@/components/layout/RouteTabs";
import { PermissionGuard } from "@/components/layout/RBACGuard";

export default function SignatoryLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const items = [
    { href: `/organizations/${id}/signatory/groups`, label: "Groups" },
    { href: `/organizations/${id}/signatory/rules`, label: "Rules" },
    { href: `/organizations/${id}/signatory/evaluate`, label: "Evaluate" },
  ];

  return (
    <PermissionGuard anyOf={["MANAGE_SIGNATORY_ANY"]}>
      <div className="space-y-6">
        <RouteTabs items={items} />
        {children}
      </div>
    </PermissionGuard>
  );
}
