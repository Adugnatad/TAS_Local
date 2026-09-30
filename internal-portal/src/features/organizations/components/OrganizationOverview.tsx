"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, Circle, MoreVertical } from "lucide-react";
import {
  useAssignOrganizationCse,
  useOrganization,
  useOrgLifecycle,
  useOrgUsers,
  useOrgUserMutations,
} from "../hooks";
import { formatOrgApiError, tinVerificationLabel, canAddOrgUsers } from "../tin";
import { useEmployees } from "@/features/employees/hooks";
import { useSession } from "@/features/auth/hooks/useSession";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function OnboardingStep({
  done,
  label,
  action,
}: {
  done: boolean;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        {done ? (
          <CheckCircle2 className="size-4 text-green-600" aria-hidden />
        ) : (
          <Circle className="size-4 text-muted-foreground" aria-hidden />
        )}
        <span className={done ? "text-muted-foreground" : "font-medium"}>{label}</span>
      </div>
      {!done && action}
    </li>
  );
}

export function OrganizationOverview({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const query = useOrganization(orgId);
  const lifecycle = useOrgLifecycle(orgId);
  const assignCse = useAssignOrganizationCse(orgId);
  const users = useOrgUsers(orgId, { page: 0, size: 20 });
  const userMutations = useOrgUserMutations(orgId);
  const employees = useEmployees({ page: 0, size: 100 });
  const canManage = can("MANAGE_ORGANIZATIONS") && query.data?.status !== "TERMINATED";
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedCseId, setSelectedCseId] = useState("");

  const cseOptions =
    employees.data?.content.filter(
      (employee) => employee.status === "ACTIVE" && employee.roles.includes("BankCSE"),
    ) ?? [];

  async function run(action: () => Promise<unknown>, ok: string) {
    try {
      await action();
      toast.success(ok);
      await query.refetch();
    } catch (error) {
      toast.error(formatOrgApiError(error, "Action failed."));
    }
  }

  async function onAssignCse() {
    if (!selectedCseId) {
      toast.error("Select a CSE employee.");
      return;
    }
    try {
      await assignCse.mutateAsync(selectedCseId);
      toast.success(query.data?.assignedCseUserId ? "CSE reassigned." : "CSE assigned.");
      setAssignOpen(false);
      setSelectedCseId("");
    } catch (error) {
      toast.error(formatOrgApiError(error, "Assign CSE failed."));
    }
  }

  if (query.isLoading) return <Skeleton className="h-48 w-full" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const org = query.data;
  const hasCse = Boolean(org.assignedCseUserId);
  const addUsersGate = canAddOrgUsers(org);
  const tin = tinVerificationLabel(org);
  const missingFormOfBusiness = !org.formOfBusiness;
  const infoRows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Customer ID", value: org.cbsCustomerId || org.crmSystemId || org.tin || "—" },
    { label: "Form of business", value: org.formOfBusiness ?? "Missing" },
    {
      label: "Segment",
      value: org.segment ?? (
        <span>
          Not set
          {canManage && (
            <>
              {" — "}
              <Link href={`/organizations/${orgId}/edit`} className="text-primary underline">
                set on edit
              </Link>
            </>
          )}
        </span>
      ),
    },
    { label: "TIN", value: org.tin ?? "—" },
    { label: "Phone", value: org.phone ?? "—" },
    { label: "Address", value: org.address ?? "—" },
    { label: "Description", value: org.description ?? "—" },
    { label: "CRM ID", value: org.crmSystemId ?? "—" },
    { label: "CBS ID", value: org.cbsCustomerId ?? "—" },
    {
      label: "Assigned CSE",
      value: org.assignedCseName || org.assignedCseUsername || "—",
    },
    { label: "CSE username", value: org.assignedCseUsername ?? "—" },
    { label: "CSE CRM ID", value: org.assignedCseCrmSystemId ?? "—" },
    { label: "Effective Date", value: formatDate(org.effectiveDate) },
    { label: "Expiry Date", value: formatDate(org.expiryDate) },
    { label: "Created by", value: org.createdBy ?? "—" },
    {
      label: "TIN validation",
      value: (
        <div className="flex items-center gap-2">
          <StatusBadge status={tin.status} label={tin.label} />
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              disabled={lifecycle.revalidate.isPending}
              onClick={() =>
                run(
                  () => lifecycle.revalidate.mutateAsync(),
                  "Business validation complete.",
                )
              }
            >
              {lifecycle.revalidate.isPending ? "Validating..." : "Validate Business"}
            </Button>
          )}
        </div>
      ),
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

      {missingFormOfBusiness && (
        <Alert>
          <AlertTitle>Form of business is missing</AlertTitle>
          <AlertDescription>
            This organization cannot raise a loan request until a form of business is set on its
            profile.
            {canManage ? " Use Edit organization to fix it." : " Contact a bank administrator."}
          </AlertDescription>
        </Alert>
      )}

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <SectionTitle>Onboarding checklist</SectionTitle>
        <ol className="divide-y">
          <OnboardingStep done label="Organization created" />
          <OnboardingStep
            done={hasCse}
            label="CSE assigned"
            action={
              canManage ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCseId(org.assignedCseUserId ?? "");
                    setAssignOpen(true);
                  }}
                >
                  {hasCse ? "Reassign" : "Assign CSE"}
                </Button>
              ) : undefined
            }
          />
          <OnboardingStep
            done={org.tinValidationStatus === "VALIDATED"}
            label="TIN & Business verified"
            action={
              canManage ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={lifecycle.revalidate.isPending}
                    onClick={() =>
                      run(
                        () => lifecycle.revalidate.mutateAsync(),
                        "Business validation complete.",
                      )
                    }
                  >
                    {lifecycle.revalidate.isPending ? "Validating..." : "Validate Business"}
                  </Button>
                  {org.tinValidationStatus !== "VALIDATED" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          run(() => lifecycle.verifyTin.mutateAsync(), "TIN verification complete.")
                        }
                      >
                        Verify TIN
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
                    </>
                  )}
                </div>
              ) : undefined
            }
          />
          <OnboardingStep
            done={addUsersGate.ok && (users.data?.content.length ?? 0) > 0}
            label="Add users"
            action={
              canManage && addUsersGate.ok ? (
                <Link
                  href={`/organizations/${orgId}/users/new`}
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  Add user
                </Link>
              ) : canManage && !addUsersGate.ok ? (
                <span className="text-xs text-muted-foreground">{addUsersGate.reason}</span>
              ) : undefined
            }
          />
        </ol>
        {org.tinValidationStatus !== "VALIDATED" && org.tinValidationReason && (
          <p className="mt-3 text-sm text-muted-foreground">{org.tinValidationReason}</p>
        )}
      </section>

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
        {org.tinValidationReason && (
          <p className="mt-3 text-sm text-muted-foreground">{org.tinValidationReason}</p>
        )}
        {(org.tinEnteredName || org.tinRegisteredName) && (
          <div className="mt-4 space-y-1 rounded-md border bg-muted/40 p-3 text-xs">
            <p>
              Entered name: <span className="font-medium">{org.tinEnteredName ?? "—"}</span>
            </p>
            <p>
              Registered name: <span className="font-medium">{org.tinRegisteredName ?? "—"}</span>
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
          {canManage &&
            (addUsersGate.ok ? (
              <Link
                href={`/organizations/${orgId}/users/new`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Add user
              </Link>
            ) : (
              <Button size="sm" disabled title={addUsersGate.reason}>
                Add user
              </Button>
            ))}
        </div>
        {!addUsersGate.ok && (
          <p className="mb-3 text-sm text-muted-foreground">{addUsersGate.reason}</p>
        )}
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

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{hasCse ? "Reassign CSE" : "Assign CSE"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={selectedCseId || undefined}
              onValueChange={(v) => setSelectedCseId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a BankCSE employee" />
              </SelectTrigger>
              <SelectContent>
                {cseOptions.map((employee) => {
                  const label = [
                    [employee.firstName, employee.lastName].filter(Boolean).join(" ") ||
                      employee.username,
                    employee.email,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <SelectItem key={employee.id} value={employee.id}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void onAssignCse()} disabled={assignCse.isPending}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
