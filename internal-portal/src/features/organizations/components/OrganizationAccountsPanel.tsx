"use client";

import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useOrgAccountMutations, useOrgAccounts } from "../hooks";
import { formatOrgApiError } from "../tin";
import { useSession } from "@/features/auth/hooks/useSession";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function OrganizationAccountsPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const canManage = can("MANAGE_ORGANIZATIONS");
  const query = useOrgAccounts(orgId);
  const mutations = useOrgAccountMutations(orgId);

  async function onRefresh() {
    try {
      await mutations.refresh.mutateAsync();
      toast.success("Accounts refreshed from core banking.");
    } catch (error) {
      toast.error(formatOrgApiError(error, "Refresh failed."));
    }
  }

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={mutations.refresh.isPending}
            onClick={() => void onRefresh()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh from core
          </Button>
        </div>
      )}

      {!query.data?.length ? (
        <EmptyState
          title="No accounts"
          description={
            canManage
              ? "Use Refresh from core to register accounts for this customer."
              : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Primary</TableHead>
              {canManage && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.map((account) => (
              <TableRow key={account.id ?? account.accountNo}>
                <TableCell>{account.accountNo}</TableCell>
                <TableCell>{account.currency}</TableCell>
                <TableCell>{account.accountType}</TableCell>
                <TableCell>{account.primary ? "Yes" : "No"}</TableCell>
                {canManage && (
                  <TableCell className="space-x-1 whitespace-nowrap">
                    {account.id && !account.primary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          mutations.setPrimary
                            .mutateAsync(account.id!)
                            .then(() => toast.success("Primary updated."))
                            .catch((error) => toast.error(formatOrgApiError(error)))
                        }
                      >
                        Set primary
                      </Button>
                    )}
                    {account.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          mutations.remove
                            .mutateAsync(account.id!)
                            .then(() => toast.success("Account hidden."))
                            .catch((error) => toast.error(formatOrgApiError(error)))
                        }
                      >
                        Hide
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
