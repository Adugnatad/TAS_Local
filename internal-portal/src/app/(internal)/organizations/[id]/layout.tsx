"use client";

import { useParams } from "next/navigation";
import { RouteTabs } from "@/components/layout/RouteTabs";
import { Breadcrumbs } from "@/components/layout/PageHeader";
import { useOrganization } from "@/features/organizations/hooks";
import { useSession } from "@/features/auth/hooks/useSession";
import { PermissionGuard } from "@/components/layout/RBACGuard";

export default function OrganizationSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const orgId = params.id;
  const { data } = useOrganization(orgId);
  const { can } = useSession();

  const items = [
    { href: `/organizations/${orgId}`, label: "Overview" },
    { href: `/organizations/${orgId}/users`, label: "Users" },
    { href: `/organizations/${orgId}/accounts`, label: "Accounts" },
    { href: `/organizations/${orgId}/documents`, label: "Documents" },
    { href: `/organizations/${orgId}/loans`, label: "Loans" },
    ...(can("MANAGE_SIGNATORY_ANY")
      ? [{ href: `/organizations/${orgId}/signatory/groups`, label: "Signatory" }]
      : []),
  ];

  return (
    <PermissionGuard anyOf={["VIEW_ORGANIZATIONS", "MANAGE_ORGANIZATIONS"]}>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Organizations", href: "/organizations" },
            { label: data?.name ?? "Organization" },
          ]}
        />
        <RouteTabs items={items} />
        {children}
      </div>
    </PermissionGuard>
  );
}
