export interface LoanRequest {
  id: string;
  status?: string;
  coopStreamStatus?: string;
  amount?: number;
  createdAt?: string;
  [key: string]: unknown;
}

export type LoanPayload = Record<string, unknown>;
