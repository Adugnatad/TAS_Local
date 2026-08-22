import type { RequestStage, RequestStatus, RequestType } from "@/lib/constants";

export interface RequestStatusSummary {
  id: string;
  customerId: string;
  customerName: string;
  type: RequestType;
  currentStage: RequestStage;
  status: RequestStatus;
  amount: number;
  submittedAt: string;
  lastUpdatedAt: string;
}

export interface RequestStatusDetail extends RequestStatusSummary {
  stages: Array<{
    name: RequestStage;
    completedAt?: string;
    isCurrent: boolean;
  }>;
  notes?: string;
}

export interface RequestListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: RequestType | "";
  status?: RequestStatus | "";
  customerId?: string;
  sortBy?: "lastUpdatedAt" | "submittedAt" | "amount";
  sortOrder?: "asc" | "desc";
}
