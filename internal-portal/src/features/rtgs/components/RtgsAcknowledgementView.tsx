"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useAcknowledgeRtgsTransfer, useRtgsQueue, useRtgsTransfer } from "../hooks";
import type { RtgsTransfer } from "../types";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatAmount(transfer: RtgsTransfer) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: transfer.currency,
  }).format(transfer.amount);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The transfer could not be acknowledged.";
}

export function RtgsAcknowledgementView() {
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [note, setNote] = useState("");
  const queue = useRtgsQueue(page, 20);
  const detail = useRtgsTransfer(selectedId);
  const acknowledge = useAcknowledgeRtgsTransfer();
  const transfer = detail.data;

  function openTransfer(id: string) {
    setSelectedId(id);
    setNote("");
  }

  async function acknowledgeFromQueue(id: string) {
    try {
      const result = await acknowledge.mutateAsync({ id });
      toast.success(
        result.status === "TRIGGER_FAILED"
          ? "Acknowledgement recorded; IPS trigger failed. Retry is available."
          : "Transfer acknowledged and sent to IPS.",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function submitAcknowledgement() {
    if (!transfer) return;
    try {
      const result = await acknowledge.mutateAsync({ id: transfer.id, note });
      toast.success(
        result.status === "TRIGGER_FAILED"
          ? "Acknowledgement recorded; IPS trigger failed. Retry is available."
          : "Transfer acknowledged and sent to IPS.",
      );
      setConfirmOpen(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">RTGS acknowledgements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the verified payee and release approved inter-bank transfers to IPS.
        </p>
      </div>

      {queue.isLoading ? (
        <TableSkeleton rows={6} />
      ) : queue.isError ? (
        <ErrorState onRetry={() => queue.refetch()} />
      ) : !queue.data?.content.length ? (
        <EmptyState
          title="No transfers awaiting acknowledgement"
          description="Approved RTGS transfers will appear here when Finance action is required."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Verified payee</TableHead>
                  <TableHead>Destination bank</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.data.content.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => openTransfer(item.id)}
                  >
                    <TableCell className="font-medium">{item.reference}</TableCell>
                    <TableCell>{item.debtorName}</TableCell>
                    <TableCell className="font-medium">{item.creditorName}</TableCell>
                    <TableCell>{item.destinationBankName}</TableCell>
                    <TableCell className="tabular-nums">{formatAmount(item)}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={acknowledge.isPending}
                        onClick={(event) => {
                          event.stopPropagation();
                          void acknowledgeFromQueue(item.id);
                        }}
                      >
                        Acknowledge
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <span>
              Page {(queue.data.page ?? 0) + 1} of {Math.max(queue.data.totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={queue.data.page === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={queue.data.last}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh RTGS queue"
              onClick={() => void queue.refetch()}
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </>
      )}

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transfer?.reference ?? "RTGS transfer"}</DialogTitle>
          </DialogHeader>
          {detail.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading transfer details...</p>
          ) : detail.isError || !transfer ? (
            <ErrorState onRetry={() => detail.refetch()} />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-md border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Organization</span>
                  <p className="font-medium">{transfer.debtorName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Debit account</span>
                  <p className="font-medium">{transfer.debtorAccount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Verified payee</span>
                  <p className="text-lg font-semibold">{transfer.creditorName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Creditor account</span>
                  <p className="font-medium">{transfer.creditorAccount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Destination bank</span>
                  <p className="font-medium">
                    {transfer.destinationBankName} ({transfer.destinationBankCode})
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount</span>
                  <p className="text-lg font-semibold tabular-nums">{formatAmount(transfer)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Purpose</span>
                  <p>{transfer.purpose || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Remittance</span>
                  <p>{transfer.remittanceInfo || "—"}</p>
                </div>
              </div>
              {transfer.triggerError && (
                <p className="text-sm text-destructive">
                  Previous IPS attempt: {transfer.triggerError}
                </p>
              )}
              {transfer.status === "TRIGGERED" ? (
                <p className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 className="size-4" /> Sent to IPS as {transfer.downstreamReference}.
                </p>
              ) : (
                <Button className="w-full" onClick={() => setConfirmOpen(true)}>
                  {transfer.status === "TRIGGER_FAILED"
                    ? "Retry acknowledgement"
                    : "Acknowledge and release"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release funds to {transfer?.creditorName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This acknowledgement sends {transfer ? formatAmount(transfer) : "the transfer"} to{" "}
            {transfer?.destinationBankName}. Confirm the payee and amount before continuing.
          </p>
          <div className="space-y-2">
            <Label htmlFor="acknowledgement-note">Finance note (optional)</Label>
            <Input
              id="acknowledgement-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Funds confirmed, released"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void submitAcknowledgement()} disabled={acknowledge.isPending}>
              {acknowledge.isPending ? "Sending..." : "Confirm release"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
