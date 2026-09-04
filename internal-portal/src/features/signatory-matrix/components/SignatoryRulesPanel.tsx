"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreVertical, Plus } from "lucide-react";
import {
  useApprovalRules,
  useApprovalTypeOptions,
  useCurrencies,
  useMatrixMutations,
  useSignatoryGroups,
} from "../hooks";
import type {
  ApprovalAction,
  ApprovalRule,
  CreateApprovalRuleInput,
  RangeType,
  Sequencing,
  TransactionType,
} from "../types";
import { ConditionTreeBuilder } from "./ConditionTreeBuilder";
import { ApplyTemplateDialog } from "./ApplyTemplateDialog";
import {
  defaultBuilderState,
  parseConditionTree,
  serializeBuilderState,
  type ConditionBuilderState,
} from "../utils/condition-tree";
import {
  isPerTransactionOnlyApprovalType,
  isValidEffectiveDate,
  transactionTypeForApprovalType,
} from "../validation";
import { useSession } from "@/features/auth/hooks/useSession";
import { ApiError } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

const TRANSACTION_TYPES: TransactionType[] = [
  "PER_TRANSACTION",
  "AGGREGATE_DAILY",
  "AGGREGATE_MONTHLY",
];
const RANGE_TYPES: RangeType[] = ["UPTO", "ABOVE", "BETWEEN"];
const SEQUENCING_OPTIONS: Sequencing[] = ["SEQUENTIAL", "PARALLEL"];

type RuleFormState = {
  approvalType: string;
  approvalActions: ApprovalAction[];
  transactionType: TransactionType;
  rangeType: RangeType;
  minAmount: string;
  maxAmount: string;
  currency: string;
  sequencing: Sequencing;
  approvalRequired: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  escalationTimeoutHours: string;
  escalationTo: string;
};

function emptyForm(approvalType = "LOAN_APPLICATION"): RuleFormState {
  return {
    approvalType,
    approvalActions: ["CREATE"],
    transactionType: "PER_TRANSACTION",
    rangeType: "BETWEEN",
    minAmount: "0",
    maxAmount: "1000000",
    currency: "ETB",
    sequencing: "SEQUENTIAL",
    approvalRequired: true,
    effectiveFrom: "",
    effectiveTo: "",
    escalationTimeoutHours: "",
    escalationTo: "",
  };
}

function ruleToForm(rule: ApprovalRule): RuleFormState {
  return {
    approvalType: rule.approvalType,
    approvalActions: rule.approvalActions?.length
      ? rule.approvalActions
      : rule.approvalAction
        ? [rule.approvalAction]
        : ["CREATE"],
    transactionType: transactionTypeForApprovalType(
      rule.approvalType,
      rule.transactionType ?? "PER_TRANSACTION",
    ),
    rangeType: rule.rangeType ?? "BETWEEN",
    minAmount: String(rule.minAmount ?? 0),
    maxAmount: String(rule.maxAmount ?? 0),
    currency: rule.currency ?? "ETB",
    sequencing: rule.sequencing ?? "SEQUENTIAL",
    approvalRequired: rule.approvalRequired ?? true,
    effectiveFrom: rule.effectiveFrom ?? "",
    effectiveTo: rule.effectiveTo ?? "",
    escalationTimeoutHours: rule.escalation?.timeoutHours
      ? String(rule.escalation.timeoutHours)
      : "",
    escalationTo: rule.escalation?.escalateTo ?? "",
  };
}

function formatRuleApiError(error: unknown): string {
  if (!(error instanceof ApiError)) return "Save failed.";
  if (
    error.code === "OVERLAPPING_RULE" ||
    error.code === "COVERAGE_GAP" ||
    error.code === "INSUFFICIENT_APPROVERS" ||
    error.code === "EMPTY_CONDITION" ||
    error.code === "INVALID_BAND"
  ) {
    return error.message;
  }
  if (error.code === "AGGREGATE_NOT_ALLOWED") {
    return "Loan and trade approvals must use PER_TRANSACTION.";
  }
  return error.message || "Save failed.";
}

export function SignatoryRulesPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const canManage = can("MANAGE_SIGNATORY_ANY");
  const groups = useSignatoryGroups(orgId);
  const mutations = useMatrixMutations(orgId);
  const { approvalTypes: typeOptions, approvalActions: actionOptions } = useApprovalTypeOptions();
  const currencies = useCurrencies();

  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(() => emptyForm(typeOptions[0]?.code));
  const [builderState, setBuilderState] = useState<ConditionBuilderState>(defaultBuilderState());
  const [formError, setFormError] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      type: typeFilter === "ALL" ? undefined : typeFilter,
      groupId: groupFilter === "ALL" ? undefined : groupFilter,
    }),
    [typeFilter, groupFilter],
  );

  const rules = useApprovalRules(orgId, queryParams);
  const currencyOptions = currencies.data?.length ? currencies.data : ["ETB", "USD"];

  const groupNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of groups.data ?? []) map.set(group.id, group.name);
    return map;
  }, [groups.data]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(typeOptions[0]?.code));
    setBuilderState(defaultBuilderState());
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(rule: ApprovalRule) {
    setEditing(rule);
    setForm(ruleToForm(rule));
    setBuilderState(parseConditionTree(rule));
    setFormError(null);
    setDialogOpen(true);
  }

  function buildPayload(): CreateApprovalRuleInput | null {
    const minAmount = Number(form.minAmount);
    const maxAmount = Number(form.maxAmount);
    if (!Number.isFinite(minAmount) || !Number.isFinite(maxAmount)) {
      setFormError("Enter valid min and max amounts.");
      return null;
    }
    if (!form.approvalActions.length) {
      setFormError("Select at least one approval action.");
      return null;
    }
    if (!isValidEffectiveDate(form.effectiveFrom) || !isValidEffectiveDate(form.effectiveTo)) {
      setFormError("Effective dates must use YYYY-MM-DD format.");
      return null;
    }
    if (form.effectiveFrom && form.effectiveTo && form.effectiveFrom > form.effectiveTo) {
      setFormError("Effective from must be on or before effective to.");
      return null;
    }

    const approverPayload = serializeBuilderState(builderState);
    if (
      form.approvalRequired &&
      !approverPayload.signatoryGroupId &&
      !approverPayload.conditionTree
    ) {
      setFormError("Select at least one signatory group when approval is required.");
      return null;
    }

    const payload: CreateApprovalRuleInput = {
      approvalType: form.approvalType,
      approvalActions: form.approvalActions,
      transactionType: transactionTypeForApprovalType(form.approvalType, form.transactionType),
      rangeType: form.rangeType,
      minAmount,
      maxAmount,
      currency: form.currency || undefined,
      sequencing: form.sequencing,
      approvalRequired: form.approvalRequired,
      effectiveFrom: form.effectiveFrom || null,
      effectiveTo: form.effectiveTo || null,
    };

    if (approverPayload.signatoryGroupId) {
      payload.signatoryGroupId = approverPayload.signatoryGroupId;
    } else if (approverPayload.conditionTree) {
      payload.conditionTree = approverPayload.conditionTree;
    }

    if (form.escalationTimeoutHours || form.escalationTo) {
      payload.escalation = {
        timeoutHours: form.escalationTimeoutHours ? Number(form.escalationTimeoutHours) : undefined,
        escalateTo: form.escalationTo || undefined,
      };
    }

    return payload;
  }

  async function onSave() {
    setFormError(null);
    const payload = buildPayload();
    if (!payload) return;

    try {
      if (editing) {
        await mutations.updateRule.mutateAsync({ ruleId: editing.id, ...payload });
        toast.success("Rule updated.");
      } else {
        await mutations.createRule.mutateAsync(payload);
        toast.success("Rule created.");
      }
      setDialogOpen(false);
    } catch (error) {
      setFormError(formatRuleApiError(error));
    }
  }

  async function onDelete(ruleId: string) {
    try {
      await mutations.deleteRule.mutateAsync(ruleId);
      toast.success("Rule deleted.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Delete failed.");
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
            Amount-based rules with AND/OR signatory conditions.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTemplateOpen(true)}>
              Apply template
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add rule
            </Button>
          </div>
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
                <TableHead>Band</TableHead>
                <TableHead>Group / Tree</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.data.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-mono text-xs">{rule.approvalType}</TableCell>
                  <TableCell>{rule.approvalActions.join(", ")}</TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {rule.minAmount} – {rule.maxAmount} {rule.currency ?? "ETB"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {rule.signatoryGroupName ??
                      groupNameById.get(rule.signatoryGroupId ?? "") ??
                      (rule.conditionTree ? "Condition tree" : "—")}
                  </TableCell>
                  <TableCell>{rule.status ? <StatusBadge status={rule.status} /> : "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" aria-label="Rule actions" />}
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
                        {canManage && (
                          <DropdownMenuItem onClick={() => void onDelete(rule.id)}>
                            Delete
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
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit approval rule" : "Add approval rule"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Approval type</Label>
              <Select
                value={form.approvalType}
                onValueChange={(value) =>
                  value &&
                  setForm((prev) => ({
                    ...prev,
                    approvalType: value,
                    transactionType: transactionTypeForApprovalType(value, prev.transactionType),
                  }))
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
              <Label>Approval actions</Label>
              <div className="flex flex-wrap gap-3 pt-2">
                {actionOptions.map((item) => (
                  <div key={item.code} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id={`approval-action-${item.code}`}
                      checked={form.approvalActions.includes(item.code)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          approvalActions: e.target.checked
                            ? [...prev.approvalActions, item.code]
                            : prev.approvalActions.filter((action) => action !== item.code),
                        }))
                      }
                    />
                    <Label htmlFor={`approval-action-${item.code}`} className="font-normal">
                      {item.label || item.code}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Transaction type</Label>
              <Select
                value={form.transactionType}
                onValueChange={(value) =>
                  value &&
                  setForm((prev) => ({ ...prev, transactionType: value as TransactionType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.filter(
                    (item) =>
                      !isPerTransactionOnlyApprovalType(form.approvalType) ||
                      item === "PER_TRANSACTION",
                  ).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Range type</Label>
              <Select
                value={form.rangeType}
                onValueChange={(value) =>
                  value && setForm((prev) => ({ ...prev, rangeType: value as RangeType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGE_TYPES.map((item) => (
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
            <div className="space-y-1">
              <Label>Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(value) =>
                  value && setForm((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sequencing</Label>
              <Select
                value={form.sequencing}
                onValueChange={(value) =>
                  value && setForm((prev) => ({ ...prev, sequencing: value as Sequencing }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEQUENCING_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                checked={form.approvalRequired}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, approvalRequired: e.target.checked }))
                }
              />
              <Label>Approval required (uncheck for auto-approve band)</Label>
            </div>
            <div className="space-y-1">
              <Label>Effective from</Label>
              <Input
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => setForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Effective to</Label>
              <Input
                type="date"
                value={form.effectiveTo}
                onChange={(e) => setForm((prev) => ({ ...prev, effectiveTo: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Escalation timeout (hours)</Label>
              <Input
                value={form.escalationTimeoutHours}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, escalationTimeoutHours: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Escalate to</Label>
              <Input
                value={form.escalationTo}
                onChange={(e) => setForm((prev) => ({ ...prev, escalationTo: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-2 block">Approvers</Label>
              <ConditionTreeBuilder
                groups={groups.data ?? []}
                state={builderState}
                onChange={setBuilderState}
              />
            </div>
            {formError && <p className="sm:col-span-2 text-sm text-destructive">{formError}</p>}
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

      <ApplyTemplateDialog
        orgId={orgId}
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        groups={groups.data ?? []}
      />
    </div>
  );
}
