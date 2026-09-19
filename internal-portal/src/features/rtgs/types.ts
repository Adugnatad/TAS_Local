import type { PageResponse } from "@/types/global";

export type RtgsTransferStatus =
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "PENDING_ACKNOWLEDGEMENT"
  | "TRIGGERED"
  | "TRIGGER_FAILED"
  | string;

export interface RtgsTransfer {
  id: string;
  reference: string;
  organizationId: string;
  status: RtgsTransferStatus;
  debtorAccount: string;
  debtorName: string;
  destinationBankCode: string;
  destinationBankName: string;
  creditorAccount: string;
  creditorName: string;
  amount: number;
  currency: string;
  remittanceInfo?: string | null;
  purpose?: string | null;
  matrixEvaluationId?: string | null;
  downstreamReference?: string | null;
  triggerError?: string | null;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
  acknowledgementNote?: string | null;
  createdAt: string;
}

export type RtgsQueueResponse = PageResponse<RtgsTransfer>;
