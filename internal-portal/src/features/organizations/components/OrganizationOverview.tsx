"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useOrganization, useOrgLifecycle } from "../hooks";
import { formatOrgApiError, tinVerificationLabel } from "../tin";
import { OrganizationForm } from "./OrganizationForm";
import { useSession } from "@/features/auth/hooks/useSession";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OrganizationOverview({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const router = useRouter();
  const query = useOrganization(orgId);
  const lifecycle = useOrgLifecycle(orgId);
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

  return (
    <div className="space-y-6">
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

      <div className="flex flex-wrap gap-2">
        {canManage && (
          <>
            {org.status === "ACTIVE" && (
              <Button
                variant="outline"
                onClick={() => run(() => lifecycle.suspend.mutateAsync(), "Suspended.")}
              >
                Suspend
              </Button>
            )}
            {org.status === "SUSPENDED" && (
              <Button onClick={() => run(() => lifecycle.activate.mutateAsync(), "Activated.")}>
                Activate
              </Button>
            )}
            {org.status !== "TERMINATED" && (
              <Button
                variant="destructive"
                onClick={() => run(() => lifecycle.terminate.mutateAsync(), "Terminated.")}
              >
                Terminate
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => run(() => lifecycle.verifyTin.mutateAsync(), "TIN verification complete.")}
            >
              Verify TIN (eTrade)
            </Button>
            <Button
              variant="outline"
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
            <Button
              variant="ghost"
              onClick={async () => {
                await run(() => lifecycle.remove.mutateAsync(), "Deleted.");
                router.push("/organizations");
              }}
            >
              Soft-delete
            </Button>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={org.status} />
              <StatusBadge status={tin.status} label={tin.label} />
            </div>
            {org.tinValidationReason && <p>{org.tinValidationReason}</p>}
            {(org.tinEnteredName || org.tinRegisteredName) && (
              <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
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
            <p>TIN: {org.tin ?? "—"}</p>
            <p>Phone: {org.phone ?? "—"}</p>
            <p>Address: {org.address ?? "—"}</p>
            <p>CRM: {org.crmSystemId ?? "—"}</p>
            <p>CBS: {org.cbsCustomerId ?? "—"}</p>
            <p>Active users: {org.activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {org.accounts?.length
              ? org.accounts.map((account) => (
                  <p key={account.id ?? account.accountNo}>
                    {account.accountNo} · {account.currency} · {account.accountType}
                    {account.primary ? " (primary)" : ""}
                  </p>
                ))
              : "None"}
            <Link
              href={`/organizations/${orgId}/accounts`}
              className={cn(buttonVariants({ variant: "link" }), "px-0")}
            >
              Manage accounts
            </Link>
          </CardContent>
        </Card>
      </div>

      {canManage && org.status !== "TERMINATED" && <OrganizationForm organization={org} />}
    </div>
  );
}
