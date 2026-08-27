"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fetchAuthorized } from "../api";
import { useMatrixMutations } from "../hooks";
import type { MatrixEvaluation } from "../types";
import { APPROVAL_ACTIONS, APPROVAL_TYPES } from "@/lib/constants";
import { ApiError } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function formatAmount(amount?: number) {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount);
}

function signatoryName(person: {
  username?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
}) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
  return name || person.username || person.userId || "—";
}

function EvaluationResultCard({ result }: { result: MatrixEvaluation }) {
  const authorized =
    typeof result.authorized === "boolean"
      ? result.authorized
      : String(result.result ?? result.status ?? "")
          .toUpperCase()
          .includes("AUTHORIZ");

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: "Outcome",
      value:
        result.result || result.status ? (
          <StatusBadge status={String(result.result || result.status)} />
        ) : (
          "—"
        ),
    },
    {
      label: "Authorized",
      value:
        typeof result.authorized === "boolean" ? (
          <StatusBadge
            status={authorized ? "AUTHORIZED" : "NOT_AUTHORIZED"}
            label={authorized ? "Yes" : "No"}
          />
        ) : (
          "—"
        ),
    },
    { label: "Evaluation ID", value: result.id || "—" },
    { label: "Amount", value: formatAmount(result.amount) },
    { label: "Type", value: result.approvalType || "—" },
    { label: "Action", value: result.approvalAction || "—" },
    { label: "Request ref", value: result.requestRef || "—" },
    { label: "Matched rule", value: result.matchedRuleId || "—" },
    { label: "Signatory group", value: result.signatoryGroupId || "—" },
  ];

  if (result.message) {
    rows.push({ label: "Message", value: String(result.message) });
  }

  const signatories = Array.isArray(result.requiredSignatories)
    ? result.requiredSignatories
    : [];

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Evaluation result</CardTitle>
        <CardDescription>
          Preview only — organization signatories complete approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[130px_1fr] gap-2 text-sm">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium break-all">{row.value}</dd>
            </div>
          ))}
        </dl>

        {signatories.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-sky-800">
              Required signatories
            </h3>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-sky-50/80 hover:bg-sky-50/80">
                    <TableHead className="w-16">Order</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signatories.map((person, index) => (
                    <TableRow key={person.userId ?? person.username ?? index}>
                      <TableCell className="tabular-nums">
                        {person.order ?? index + 1}
                      </TableCell>
                      <TableCell>{signatoryName(person)}</TableCell>
                      <TableCell>{person.username ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SignatoryEvaluatePanel({ orgId }: { orgId: string }) {
  const mutations = useMatrixMutations(orgId);
  const [approvalType, setApprovalType] = useState(APPROVAL_TYPES[0]);
  const [approvalAction, setApprovalAction] = useState(APPROVAL_ACTIONS[0]);
  const [amount, setAmount] = useState("100000");
  const [requestRef, setRequestRef] = useState("");
  const [result, setResult] = useState<MatrixEvaluation | null>(null);

  async function onEvaluate() {
    try {
      const data = await mutations.evaluate.mutateAsync({
        approvalType,
        approvalAction,
        amount: Number(amount),
        requestRef: requestRef || undefined,
      });
      setResult(data);
      toast.success("Evaluation complete.");
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
      const data = (await fetchAuthorized(orgId, requestRef)) as MatrixEvaluation;
      setResult(data);
      toast.success("Authorized signatories loaded.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Lookup failed.");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Matrix evaluation</CardTitle>
          <CardDescription>
            Bank staff can preview evaluations but cannot approve or reject them. Signing stays
            with organization signatories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={approvalType}
                onValueChange={(value) => value && setApprovalType(value)}
              >
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
            <div className="space-y-1.5">
              <Label>Action</Label>
              <Select
                value={approvalAction}
                onValueChange={(value) => value && setApprovalAction(value)}
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
            <div className="space-y-1.5">
              <Label htmlFor="eval-amount">Amount</Label>
              <Input
                id="eval-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eval-ref">Request ref</Label>
              <Input
                id="eval-ref"
                value={requestRef}
                onChange={(e) => setRequestRef(e.target.value)}
                placeholder="Optional for evaluate"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void onEvaluate()} disabled={mutations.evaluate.isPending}>
              Evaluate
            </Button>
            <Button variant="outline" onClick={() => void onAuthorized()}>
              View authorized
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && <EvaluationResultCard result={result} />}
    </div>
  );
}
