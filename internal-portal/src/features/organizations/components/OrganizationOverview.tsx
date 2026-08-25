"use client";

import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import { MoreVertical } from "lucide-react";
import { useOrganization, useOrgLifecycle, useOrgUsers, useOrgUserMutations } from "../hooks";
import { formatOrgApiError, tinVerificationLabel } from "../tin";
import { useSession } from "@/features/auth/hooks/useSession";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    const date = value.includes("T") ? parseISO(value) : new Date(value);
    return isValid(date) ? format(date, "MMM d, yyyy") : value;
  } catch {
    return value;
  }
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-sky-800">
      <span className="h-4 w-1 rounded-full bg-primary" aria-hidden />
      {children}
    </h2>
  );
}

export function OrganizationOverview({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const query = useOrganization(orgId);
  const lifecycle = useOrgLifecycle(orgId);
  const users = useOrgUsers(orgId, { page: 0, size: 20 });
  const userMutations = useOrgUserMutations(orgId);
  const canManage = can("MANAGE_ORGANIZATIONS");

  async function run(action: () => Promise<unknown>, ok: string) {
    try {
      await action();
      toast.success(ok);
      await query.refetch();
    } catch (error) {
      toast.error(formatOrgApiError(error, "Action failed."));
    }
  }

  if (query.isLoading) return <Skeleton className="h-48 w-full" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const org = query.data;
  const tin = tinVerificationLabel(org);
  const infoRows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Customer ID", value: org.cbsCustomerId || org.crmSystemId || org.tin || "—" },
    { label: "TIN", value: org.tin ?? "—" },
    { label: "Phone", value: org.phone ?? "—" },
    { label: "Address", value: org.address ?? "—" },
    { label: "CRM ID", value: org.crmSystemId ?? "—" },
    { label: "CBS ID", value: org.cbsCustomerId ?? "—" },
    { label: "Effective Date", value: formatDate(org.effectiveDate) },
    { label: "Expiry Date", value: formatDate(org.expiryDate) },
    { label: "Created by", value: org.createdBy ?? "—" },
    {
      label: "TIN validation",
      value: <StatusBadge status={tin.status} label={tin.label} />,
    },
  ];

  return (
    <div className="space-y-8">
      {org.warnings?.length > 0 && (
        <Alert>
          <AlertTitle>Validation warnings</AlertTitle>
          <AlertDescription>{org.warnings.join(" · ")}</AlertDescription>
        </Alert>
      )}

      {org.tinValidationStatus !== "VALIDATED" && (
        <Alert>
          <AlertTitle>TIN not verified for CoopStream</AlertTitle>
          <AlertDescription>
            Loan requests can be created, but submit returns ORG_NOT_VERIFIED until verify-tin or
            team verification succeeds.
          </AlertDescription>
        </Alert>
      )}

      {canManage && org.tinValidationStatus !== "VALIDATED" && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => run(() => lifecycle.verifyTin.mutateAsync(), "TIN verification complete.")}
          >
            Verify TIN (eTrade)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const note = window.prompt("Team verification note");
              if (!note?.trim()) return;
              void run(
                () => lifecycle.verifyManual.mutateAsync(note.trim()),
                "Marked verified by team.",
              );
            }}
          >
            Team verify
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active Users", value: org.activeUsers },
          { label: "Accounts", value: org.accounts?.length ?? 0 },
          { label: "Operational", value: org.status === "ACTIVE" ? "Yes" : "No" },
          { label: "Deleted", value: org.status === "TERMINATED" ? "Yes" : "No" },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border bg-background px-4 py-3 shadow-sm">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      <section>
        <SectionTitle>Contract Information</SectionTitle>
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {infoRows.map((row) => (
            <div key={row.label} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </div>
        {(org.tinEnteredName || org.tinRegisteredName) && (
          <div className="mt-4 rounded-md border bg-muted/40 p-3 text-xs space-y-1">
            <p>
              Entered name: <span className="font-medium">{org.tinEnteredName ?? "—"}</span>
            </p>
            <p>
              Registered name:{" "}
              <span className="font-medium">{org.tinRegisteredName ?? "—"}</span>
            </p>
            <p>
              Name match:{" "}
              <span className="font-medium">
                {org.tinNameMatchPercent != null ? `${org.tinNameMatchPercent}%` : "—"}
              </span>
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <SectionTitle>Contract Users</SectionTitle>
          {canManage && (
            <Link
              href={`/organizations/${orgId}/users/new`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Add user
            </Link>
          )}
        </div>
        {users.isLoading ? (
          <TableSkeleton rows={4} />
        ) : users.isError ? (
          <ErrorState onRetry={() => users.refetch()} />
        ) : !users.data?.content.length ? (
          <EmptyState title="No users" description="Add a user to this contract." />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-sky-50/80 hover:bg-sky-50/80">
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.content.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email ?? "—"}</TableCell>
                    <TableCell className="uppercase">{user.role}</TableCell>
                    <TableCell>{user.permissionType}</TableCell>
                    <TableCell>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label="User actions" />
                            }
                          >
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              render={<Link href={`/organizations/${orgId}/users`} />}
                            >
                              Manage users
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                userMutations.setActive
                                  .mutateAsync({
                                    userId: user.id,
                                    active: user.status !== "ACTIVE",
                                  })
                                  .then(() => toast.success("Status updated."))
                                  .catch((error) => toast.error(formatOrgApiError(error)))
                              }
                            >
                              {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
