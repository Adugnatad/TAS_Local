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

export type RoleMatch = "all" | "any";

export interface Signatory {
  id: string;
  customerId: string;
  fullName: string;
  role: string;
  signatureLimit: number;
  isActive: boolean;
}

export interface SignatoryRule {
  id: string;
  customerId: string;
  minSignatories: number;
  maxSignatories?: number;
  requiredRoles?: string[];
  roleMatch: RoleMatch;
  dualControl: boolean;
  amountThreshold: number;
}

export interface SignatoryTitle {
  id: string;
  name: string;
  isActive: boolean;
}

export interface MatrixPreviewResult {
  amount: number;
  applicableRules: SignatoryRule[];
  validCombinations: Array<{
    signatories: Signatory[];
    satisfiesRules: boolean;
    reason?: string;
  }>;
  canApprove: boolean;
  summary: string;
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
