"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw } from "lucide-react";
import { useLinkableAccounts, useOrgAccountMutations, useOrgAccounts, useOrganization } from "../hooks";
import { validateAccountSelection } from "../schemas";
import { formatOrgApiError } from "../tin";
import { useSession } from "@/features/auth/hooks/useSession";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountSelectionTable } from "./AccountSelectionTable";

function displayValue(value: string | null | undefined) {
  return value ?? "—";
}

export function OrganizationAccountsPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const org = useOrganization(orgId);
  const canManage = can("MANAGE_ORGANIZATIONS") && org.data?.status !== "TERMINATED";
  const [includeUnselected, setIncludeUnselected] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [seedAccountNo, setSeedAccountNo] = useState("");
  const [lookupTriggered, setLookupTriggered] = useState(false);
  const [selectedAccountNos, setSelectedAccountNos] = useState<Set<string>>(new Set());

  const query = useOrgAccounts(orgId, { includeUnselected });
  const mutations = useOrgAccountMutations(orgId);
  const linkable = useLinkableAccounts(orgId, seedAccountNo.trim() || undefined, lookupTriggered);

  const disabledAccountNos = useMemo(() => {
    const linked = new Set<string>();
    linkable.data?.accounts.forEach((a) => {
      if (a.alreadyLinked) linked.add(a.accountNo);
    });
    return linked;
  }, [linkable.data]);

  async function onRefresh() {
    try {
      await mutations.refresh.mutateAsync();
      toast.success("Accounts refreshed from core banking.");
    } catch (error) {
      toast.error(formatOrgApiError(error, "Refresh failed."));
    }
  }

  function onToggleAccount(accountNo: string, checked: boolean) {
    setSelectedAccountNos((prev) => {
      const next = new Set(prev);
      if (checked) next.add(accountNo);
      else next.delete(accountNo);
      return next;
    });
  }

  function onOpenLinkDialog() {
    setSeedAccountNo("");
    setLookupTriggered(false);
    setSelectedAccountNos(new Set());
    setLinkOpen(true);
  }

  function onLookupLinkable() {
    if (!seedAccountNo.trim()) {
      toast.error("Enter an account number to look up.");
      return;
    }
    setLookupTriggered(true);
    setSelectedAccountNos(new Set());
  }

  async function onLinkAccounts() {
    const toLink = Array.from(selectedAccountNos).filter((no) => !disabledAccountNos.has(no));
    const error = validateAccountSelection(toLink);
    if (error) {
      toast.error(error);
      return;
    }
    try {
      await mutations.link.mutateAsync(toLink);
      toast.success("Accounts linked.");
      setLinkOpen(false);
    } catch (err) {
      toast.error(formatOrgApiError(err, "Link failed."));
    }
  }

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={includeUnselected}
            onChange={(e) => setIncludeUnselected(e.target.checked)}
          />
          Show unselected accounts
        </label>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onOpenLinkDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add accounts
            </Button>
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
      </div>

      {!query.data?.length ? (
        <EmptyState
          title="No accounts"
          description={
            canManage
              ? "Use Add accounts or Refresh from core to register accounts for this customer."
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
              {includeUnselected && <TableHead>Selected</TableHead>}
              {canManage && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.map((account) => (
              <TableRow key={account.id ?? account.accountNo}>
                <TableCell>{account.accountNo}</TableCell>
                <TableCell>{displayValue(account.currency)}</TableCell>
                <TableCell>{displayValue(account.accountType)}</TableCell>
                <TableCell>{account.primary ? "Yes" : "No"}</TableCell>
                {includeUnselected && (
                  <TableCell>{account.selected === false ? "No" : "Yes"}</TableCell>
                )}
                {canManage && (
                  <TableCell className="space-x-1 whitespace-nowrap">
                    {account.id && !account.primary && account.selected !== false && (
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
                    {account.id && account.selected !== false && !account.primary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          mutations.deselect
                            .mutateAsync(account.id!)
                            .then(() => toast.success("Account deselected."))
                            .catch((error) => toast.error(formatOrgApiError(error)))
                        }
                      >
                        Deselect
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add accounts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seed-account">Account number (optional seed)</Label>
              <div className="flex gap-2">
                <Input
                  id="seed-account"
                  placeholder="Look up customer accounts"
                  value={seedAccountNo}
                  onChange={(e) => {
                    setSeedAccountNo(e.target.value);
                    setLookupTriggered(false);
                  }}
                />
                <Button type="button" variant="outline" onClick={onLookupLinkable}>
                  Look up
                </Button>
              </div>
            </div>
            {linkable.isLoading && (
              <p className="text-sm text-muted-foreground">Loading accounts…</p>
            )}
            {linkable.isError && (
              <p className="text-sm text-destructive">
                {formatOrgApiError(linkable.error, "Lookup failed.")}
              </p>
            )}
            {linkable.data && (
              <>
                {linkable.data.listingComplete === false && (
                  <Alert>
                    <AlertDescription>
                      We could not list all accounts for this customer. The list below may be
                      incomplete.
                    </AlertDescription>
                  </Alert>
                )}
                <AccountSelectionTable
                  accounts={linkable.data.accounts}
                  selectedAccountNos={selectedAccountNos}
                  onToggle={onToggleAccount}
                  disabledAccountNos={disabledAccountNos}
                />
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLinkOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void onLinkAccounts()}
                disabled={mutations.link.isPending || selectedAccountNos.size === 0}
              >
                Link selected
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
