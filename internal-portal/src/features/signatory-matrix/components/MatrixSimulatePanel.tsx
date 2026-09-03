"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useApprovalTypeOptions,
  useCurrencies,
  useMatrixMutations,
} from "../hooks";
import type { SimulationResponse, TransactionType } from "../types";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TRANSACTION_TYPES: TransactionType[] = [
  "PER_TRANSACTION",
  "AGGREGATE_DAILY",
  "AGGREGATE_MONTHLY",
];

export function MatrixSimulatePanel({ orgId }: { orgId: string }) {
  const mutations = useMatrixMutations(orgId);
  const { approvalTypes: typeOptions, approvalActions: actionOptions } = useApprovalTypeOptions();
  const currencies = useCurrencies();
  const currencyOptions = currencies.data?.length ? currencies.data : ["ETB", "USD"];

  const [approvalType, setApprovalType] = useState(typeOptions[0]?.code ?? "LOAN_APPLICATION");
  const [approvalAction, setApprovalAction] = useState(actionOptions[0]?.code ?? "CREATE");
  const [transactionType, setTransactionType] = useState<TransactionType>("PER_TRANSACTION");
  const [amount, setAmount] = useState("1500000");
  const [currency, setCurrency] = useState("ETB");
  const [result, setResult] = useState<SimulationResponse | null>(null);

  async function onSimulate() {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount)) {
      toast.error("Enter a valid amount.");
      return;
    }
    try {
      const response = await mutations.simulate.mutateAsync({
        approvalType,
        approvalAction,
        amount: parsedAmount,
        currency,
        transactionType,
      });
      setResult(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Simulation failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Test this configuration</h2>
        <p className="text-sm text-muted-foreground">
          Run a hypothetical transaction through the real approval engine (no persistence).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
        <div className="space-y-1">
          <Label>Approval type</Label>
          <Select value={approvalType} onValueChange={(v) => v && setApprovalType(v)}>
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
          <Select value={approvalAction} onValueChange={(v) => v && setApprovalAction(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Transaction type</Label>
          <Select
            value={transactionType}
            onValueChange={(v) => v && setTransactionType(v as TransactionType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
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
          <Label>Amount</Label>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => void onSimulate()} disabled={mutations.simulate.isPending}>
            Simulate
          </Button>
        </div>
      </div>

      {result && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Approval required:</span>{" "}
              {result.approvalRequired ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-muted-foreground">Ambiguous:</span>{" "}
              {result.ambiguous ? "Yes" : "No"}
            </p>
            {result.matchedRuleId && (
              <p>
                <span className="text-muted-foreground">Matched rule:</span> {result.matchedRuleId}
              </p>
            )}
            {result.reason && (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Reason:</span> {result.reason}
              </p>
            )}
          </div>
          {result.involvedGroups?.length && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Min approvals</TableHead>
                  <TableHead>Eligible members</TableHead>
                  <TableHead>Sufficient</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.involvedGroups.map((group) => (
                  <TableRow key={group.groupId}>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.minApprovals}</TableCell>
                    <TableCell>{group.eligibleActiveMembers}</TableCell>
                    <TableCell>{group.sufficient ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
