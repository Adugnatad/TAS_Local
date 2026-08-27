export interface SignatoryGroup {
  id: string;
  name: string;
  description?: string | null;
  status?: string;
}

export interface SignatoryMember {
  id: string;
  userId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  order?: number;
}

export interface ApprovalRule {
  id: string;
  approvalType: string;
  approvalAction: string;
  minAmount: number;
  maxAmount: number;
  signatoryGroupId: string;
  status?: string;
}

export interface MatrixEvaluation {
  id?: string;
  result?: string;
  status?: string;
  authorized?: boolean;
  amount?: number;
  approvalType?: string;
  approvalAction?: string;
  requestRef?: string;
  matchedRuleId?: string;
  signatoryGroupId?: string;
  message?: string;
  requiredSignatories?: Array<{
    userId?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    order?: number;
  }>;
  [key: string]: unknown;
}
