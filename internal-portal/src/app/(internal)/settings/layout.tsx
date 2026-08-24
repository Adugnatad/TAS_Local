"use client";

import { RouteTabs } from "@/components/layout/RouteTabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { RBACGuard } from "@/components/layout/RBACGuard";
import { useCan } from "@/features/settings/hooks/useCan";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const canManageRoles = useCan("users.manage");

  const items = [
    { href: "/settings/signatory", label: "Signatory" },
    ...(canManageRoles ? [{ href: "/settings/roles", label: "Roles" }] : []),
  ];

  return (
    <RBACGuard allowedRoles={["supervisor", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Signatory titles and portal role permissions."
        />
        <RouteTabs items={items} />
        {children}
      </div>
    </RBACGuard>
  );
}
