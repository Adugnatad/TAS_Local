"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreVertical, Plus } from "lucide-react";
import { useApprovalRules, useApprovalTypes, useMatrixMutations, useSignatoryGroups } from "../hooks";
import type { ApprovalRule } from "../types";
import { useSession } from "@/features/auth/hooks/useSession";
import { APPROVAL_ACTIONS, APPROVAL_TYPES } from "@/lib/constants";
import { ApiError } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type RuleFormState = {
  approvalType: string;
  approvalAction: string;
  minAmount: string;
  maxAmount: string;
  signatoryGroupId: string;
};

const emptyForm = (approvalType = APPROVAL_TYPES[0] as string): RuleFormState => ({
  approvalType,
  approvalAction: APPROVAL_ACTIONS[0],
  minAmount: "0",
  maxAmount: "1000000",
  signatoryGroupId: "",
});

export function SignatoryRulesPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const canManage = can("MANAGE_SIGNATORY_ANY");
  const groups = useSignatoryGroups(orgId);
  const mutations = useMatrixMutations(orgId);
  const approvalTypes = useApprovalTypes();
  const typeOptions = approvalTypes.data ?? APPROVAL_TYPES.map((code) => ({ code, label: code }));

  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(() => emptyForm(typeOptions[0]?.code));

  const queryParams = useMemo(
    () => ({
      type: typeFilter === "ALL" ? undefined : typeFilter,
      groupId: groupFilter === "ALL" ? undefined : groupFilter,
    }),
    [typeFilter, groupFilter],
  );

  const rules = useApprovalRules(orgId, queryParams);

  const groupNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of groups.data ?? []) map.set(group.id, group.name);
    return map;
  }, [groups.data]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(typeOptions[0]?.code));
    setDialogOpen(true);
  }

  function openEdit(rule: ApprovalRule) {
    setEditing(rule);
    setForm({
      approvalType: rule.approvalType,
      approvalAction: rule.approvalAction,
      minAmount: String(rule.minAmount),
      maxAmount: String(rule.maxAmount),
      signatoryGroupId: rule.signatoryGroupId,
    });
    setDialogOpen(true);
  }

  async function onSave() {
    const payload = {
      approvalType: form.approvalType,
      approvalAction: form.approvalAction,
      minAmount: Number(form.minAmount),
      maxAmount: Number(form.maxAmount),
      signatoryGroupId: form.signatoryGroupId,
    };
    if (!payload.signatoryGroupId) {
      toast.error("Select a signatory group.");
      return;
    }
    if (!Number.isFinite(payload.minAmount) || !Number.isFinite(payload.maxAmount)) {
      toast.error("Enter valid min and max amounts.");
      return;
    }

    try {
      if (editing) {
        try {
          await mutations.updateRule.mutateAsync({ ruleId: editing.id, ...payload });
        } catch (error) {
          // Fallback when Portal Core has no PUT for rules
          if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
            await mutations.setRuleActive.mutateAsync({ ruleId: editing.id, active: false });
            await mutations.createRule.mutateAsync(payload);
            toast.success("Rule replaced (update endpoint unavailable).");
            setDialogOpen(false);
            return;
          }
          throw error;
        }
        toast.success("Rule updated.");
      } else {
        await mutations.createRule.mutateAsync(payload);
        toast.success("Rule created.");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Save failed.");
    }
  }

  if (rules.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rules.isError) return <ErrorState onRetry={() => rules.refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Approval rules</h2>
          <p className="text-sm text-muted-foreground">
            Amount-based rules that bind a transaction type to a signatory group.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add rule
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={typeFilter} onValueChange={(value) => value && setTypeFilter(value)}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by approval type">
            <SelectValue placeholder="Filter by approval type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All approval types</SelectItem>
            {typeOptions.map((item) => (
              <SelectItem key={item.code} value={item.code}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={groupFilter} onValueChange={(value) => value && setGroupFilter(value)}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by signatory group">
            <SelectValue placeholder="Filter by signatory group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All signatory groups</SelectItem>
            {(groups.data ?? []).map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!rules.data?.length ? (
        <EmptyState title="No approval rules" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-sky-50/80 hover:bg-sky-50/80">
                <TableHead>Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>Signatory group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.data.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-mono text-xs">{rule.approvalType}</TableCell>
                  <TableCell>{rule.approvalAction}</TableCell>
                  <TableCell className="tabular-nums">{rule.minAmount}</TableCell>
                  <TableCell className="tabular-nums">{rule.maxAmount}</TableCell>
                  <TableCell>
                    {groupNameById.get(rule.signatoryGroupId) ?? rule.signatoryGroupId}
                  </TableCell>
                  <TableCell>
                    {rule.status ? <StatusBadge status={rule.status} /> : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label="Rule actions" />
                        }
                      >
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canManage && (
                          <DropdownMenuItem onClick={() => openEdit(rule)}>Edit</DropdownMenuItem>
                        )}
                        {canManage && (
                          <DropdownMenuItem
                            onClick={() =>
                              mutations.setRuleActive
                                .mutateAsync({
                                  ruleId: rule.id,
                                  active: rule.status !== "ACTIVE",
                                })
                                .then(() => toast.success("Rule updated."))
                                .catch((error) =>
                                  toast.error(
                                    error instanceof ApiError ? error.message : "Action failed.",
                                  ),
                                )
                            }
                          >
                            {rule.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit approval rule" : "Add approval rule"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Approval type</Label>
              <Select
                value={form.approvalType}
                onValueChange={(value) =>
                  value && setForm((prev) => ({ ...prev, approvalType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Approval action</Label>
              <Select
                value={form.approvalAction}
                onValueChange={(value) =>
                  value && setForm((prev) => ({ ...prev, approvalAction: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPROVAL_ACTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Min amount</Label>
              <Input
                value={form.minAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, minAmount: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Max amount</Label>
              <Input
                value={form.maxAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, maxAmount: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Signatory group</Label>
              <Select
                value={form.signatoryGroupId || undefined}
                onValueChange={(value) =>
                  value && setForm((prev) => ({ ...prev, signatoryGroupId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {(groups.data ?? []).map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void onSave()}
              disabled={mutations.createRule.isPending || mutations.updateRule.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
