"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useApprovalRules, useMatrixMutations, useSignatoryGroups } from "../hooks";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SignatoryRulesPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const canManage = can("MANAGE_SIGNATORY_ANY");
  const rules = useApprovalRules(orgId);
  const groups = useSignatoryGroups(orgId);
  const mutations = useMatrixMutations(orgId);
  const [approvalType, setApprovalType] = useState(APPROVAL_TYPES[0]);
  const [approvalAction, setApprovalAction] = useState(APPROVAL_ACTIONS[0]);
  const [minAmount, setMinAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("1000000");
  const [groupId, setGroupId] = useState("");

  async function onCreate() {
    try {
      await mutations.createRule.mutateAsync({
        approvalType,
        approvalAction,
        minAmount: Number(minAmount),
        maxAmount: Number(maxAmount),
        signatoryGroupId: groupId,
      });
      toast.success("Rule created.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Create failed.");
    }
  }

  if (rules.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rules.isError) return <ErrorState onRetry={() => rules.refetch()} />;

  return (
    <div className="space-y-6">
      {!rules.data?.length ? (
        <EmptyState title="No approval rules" />
      ) : (
        <ul className="space-y-2">
          {rules.data.map((rule) => (
            <li key={rule.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
              <div className="text-sm">
                <p className="font-medium">
                  {rule.approvalType} / {rule.approvalAction}
                </p>
                <p className="text-muted-foreground">
                  {rule.minAmount} – {rule.maxAmount}
                </p>
                {rule.status && <StatusBadge status={rule.status} />}
              </div>
              {canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    mutations.setRuleActive.mutateAsync({
                      ruleId: rule.id,
                      active: rule.status !== "ACTIVE",
                    })
                  }
                >
                  {rule.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="grid max-w-xl gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={approvalType} onValueChange={(value) => value && setApprovalType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPROVAL_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Action</Label>
            <Select value={approvalAction} onValueChange={(value) => value && setApprovalAction(value)}>
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
            <Input value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Max amount</Label>
            <Input value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Signatory group</Label>
            <Select value={groupId} onValueChange={(value) => value && setGroupId(value)}>
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
          <Button onClick={onCreate} disabled={!groupId}>
            Create rule
          </Button>
        </div>
      )}
    </div>
  );
}
