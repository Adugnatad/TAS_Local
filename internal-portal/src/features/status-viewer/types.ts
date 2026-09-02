export type RequestStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";

export interface RequestStatusSummary {
  id: string;
  organizationName: string;
  organizationTin?: string;
  requestType: string;
  submittedAt: string;
  updatedAt: string;
  reviewer: string;
  status: RequestStatus;
  notes: string;
  riskLevel?: "Low" | "Medium" | "High";
}
