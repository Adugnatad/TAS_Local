"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fetchAuthorized } from "../api";
import { useMatrixMutations } from "../hooks";
import { APPROVAL_ACTIONS, APPROVAL_TYPES } from "@/lib/constants";
import { ApiError } from "@/lib/api-client";
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

export function SignatoryEvaluatePanel({ orgId }: { orgId: string }) {
  const mutations = useMatrixMutations(orgId);
  const [approvalType, setApprovalType] = useState(APPROVAL_TYPES[0]);
  const [approvalAction, setApprovalAction] = useState(APPROVAL_ACTIONS[0]);
  const [amount, setAmount] = useState("100000");
  const [requestRef, setRequestRef] = useState("");
  const [result, setResult] = useState<unknown>(null);

  async function onEvaluate() {
    try {
      const data = await mutations.evaluate.mutateAsync({
        approvalType,
        approvalAction,
        amount: Number(amount),
        requestRef: requestRef || undefined,
      });
      setResult(data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Evaluate failed.");
    }
  }

  async function onAuthorized() {
    if (!requestRef) {
      toast.error("Enter a request reference.");
      return;
    }
    try {
      setResult(await fetchAuthorized(orgId, requestRef));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Lookup failed.");
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Bank staff can preview evaluations but cannot approve or reject them. Signing stays with
        organization signatories.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
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
          <Label>Amount</Label>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Request ref</Label>
          <Input value={requestRef} onChange={(e) => setRequestRef(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onEvaluate}>Evaluate</Button>
        <Button variant="outline" onClick={onAuthorized}>
          View authorized
        </Button>
      </div>
      {result !== null && (
        <pre className="overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
