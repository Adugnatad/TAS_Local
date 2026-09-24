"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  FolderOpen,
  Landmark,
  Pencil,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Ban,
  CircleSlash,
  LayoutDashboard,
} from "lucide-react";
import { useOrganization, useOrgLifecycle } from "../hooks";
import { canAddOrgUsers, formatOrgApiError } from "../tin";
import { useApprovalRules } from "@/features/signatory-matrix/hooks";
import { useSession } from "@/features/auth/hooks/useSession";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "prefix";
  disabled?: boolean;
  disabledReason?: string;
};

export function ContractDetailShell({
  orgId,
  children,
}: {
  orgId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = useSession();
  const canManage = can("MANAGE_ORGANIZATIONS");
  const canSignatory = can("MANAGE_SIGNATORY_ANY");
  const { data: org, isLoading } = useOrganization(orgId);
  const lifecycle = useOrgLifecycle(orgId);
  const addUsersGate = canAddOrgUsers(org);
  const terminated = org?.status === "TERMINATED";
  const canWrite = canManage && !terminated;
  const rules = useApprovalRules(orgId);
  const hasNoRules = Boolean(org) && !rules.isLoading && (rules.data?.length ?? 0) === 0;

  async function run(action: () => Promise<unknown>, ok: string, redirectToList = false) {
    try {
      await action();
      toast.success(ok);
      if (redirectToList) router.push("/organizations");
    } catch (error) {
      toast.error(formatOrgApiError(error, "Action failed."));
    }
  }

  const links: NavLink[] = [
    {
      href: `/organizations/${orgId}`,
      label: "Overview",
      icon: LayoutDashboard,
      match: "exact",
    },
    ...(canWrite
      ? [
          {
            href: `/organizations/${orgId}/edit`,
            label: "Edit contract",
            icon: Pencil,
            match: "exact" as const,
          },
          {
            href: `/organizations/${orgId}/users/new`,
            label: "Add user",
            icon: UserPlus,
            match: "exact" as const,
            disabled: !addUsersGate.ok,
            disabledReason: addUsersGate.reason,
          },
        ]
      : []),
    ...(canSignatory
      ? [
          {
            href: `/organizations/${orgId}/signatory/groups`,
            label: "Signatory groups",
            icon: Users,
            match: "prefix" as const,
          },
          {
            href: `/organizations/${orgId}/signatory/rules`,
            label: "Approval rules",
            icon: ShieldCheck,
            match: "exact" as const,
          },
          {
            href: `/organizations/${orgId}/signatory/simulate`,
            label: "Simulate",
            icon: ShieldCheck,
            match: "exact" as const,
          },
          {
            href: `/organizations/${orgId}/signatory/audit`,
            label: "Audit history",
            icon: ShieldCheck,
            match: "exact" as const,
          },
        ]
      : []),
    {
      href: `/organizations/${orgId}/accounts`,
      label: "Accounts",
      icon: Landmark,
      match: "exact",
    },
    {
      href: `/organizations/${orgId}/documents`,
      label: "Documents",
      icon: FolderOpen,
      match: "exact",
    },
    {
      href: `/organizations/${orgId}/loans`,
      label: "Loans",
      icon: FileText,
      match: "prefix",
    },
    {
      href: `/organizations/${orgId}/users`,
      label: "Users",
      icon: Shield,
      match: "exact",
    },
  ];

  function isActive(item: NavLink) {
    if (item.match === "exact") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const shortId = orgId.length > 12 ? orgId.slice(0, 12) : orgId;

  return (
    <div className="space-y-4">
      {terminated && (
        <Alert>
          <AlertTitle>Organization terminated</AlertTitle>
          <AlertDescription>
            This organization cannot be changed. Staff can still review existing records.
          </AlertDescription>
        </Alert>
      )}
      {hasNoRules && !terminated && (
        <Alert>
          <AlertTitle>No approval rules configured</AlertTitle>
          <AlertDescription>
            Requests may not fail closed until a signatory matrix is in place.{" "}
            {canSignatory ? (
              <Link href={`/organizations/${orgId}/signatory/rules`} className="underline">
                Configure approval rules
              </Link>
            ) : (
              "Ask a BankAdmin to configure the matrix before go-live."
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {org?.status && <StatusBadge status={org.status} />}
              <span className="font-mono text-xs text-muted-foreground">Contract ID: {shortId}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{org?.name ?? "Contract"}</h1>
          </div>
          <Link
            href="/organizations"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr]">
          <nav className="space-y-1 border-b p-3 lg:border-b-0 lg:border-r">
            {links.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              if (item.disabled) {
                return (
                  <span
                    key={item.href}
                    title={item.disabledReason}
                    className="flex cursor-not-allowed items-center gap-2 rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground/60"
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </span>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "border-l-2 border-primary bg-sky-50 font-medium text-primary"
                      : "border-l-2 border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}

            {canWrite && (
              <div className="mt-3 space-y-1 border-t pt-3">
                {org?.status === "ACTIVE" && (
                  <Button
                    variant="ghost"
                    className="h-auto w-full justify-start gap-2 px-3 py-2 text-muted-foreground"
                    onClick={() => {
                      if (!window.confirm("Suspend this contract?")) return;
                      void run(() => lifecycle.suspend.mutateAsync(), "Suspended.");
                    }}
                  >
                    <Ban className="size-4" />
                    Suspend
                  </Button>
                )}
                {org?.status === "SUSPENDED" && (
                  <Button
                    variant="ghost"
                    className="h-auto w-full justify-start gap-2 px-3 py-2 text-muted-foreground"
                    onClick={() => {
                      if (!window.confirm("Activate this contract?")) return;
                      void run(() => lifecycle.activate.mutateAsync(), "Activated.");
                    }}
                  >
                    <ShieldCheck className="size-4" />
                    Activate
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start gap-2 px-3 py-2 text-muted-foreground"
                  onClick={() => {
                    if (!window.confirm("Terminate this contract? This cannot be undone easily."))
                      return;
                    void run(() => lifecycle.terminate.mutateAsync(), "Terminated.");
                  }}
                >
                  <CircleSlash className="size-4" />
                  Terminate
                </Button>
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (!window.confirm("Soft-delete this contract?")) return;
                    void run(() => lifecycle.remove.mutateAsync(), "Deleted.", true);
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            )}
          </nav>

          <div className="min-w-0 p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
