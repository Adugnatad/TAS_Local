export interface SignatoryGroup {
  id: string;
  name: string;
  description?: string | null;
  status?: string;
  organizationId?: string;
  members?: number;
  rules?: number;
}

export interface SignatoryMember {
  id: string;
  userId: string;
  username?: string;
  email?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  order?: number;
  approvalOrder?: number;
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

export type ConditionTreeNode =
  | { type: "GROUP"; groupId: string; minApprovals: number }
  | { type: "AND"; children: ConditionTreeNode[] }
  | { type: "OR"; children: ConditionTreeNode[] };

export type TransactionType = "PER_TRANSACTION" | "AGGREGATE_DAILY" | "AGGREGATE_MONTHLY";
export type RangeType = "UPTO" | "ABOVE" | "BETWEEN";
export type Sequencing = "SEQUENTIAL" | "PARALLEL";

export interface RuleEscalation {
  timeoutHours?: number;
  escalateTo?: string;
}

export interface ApprovalRule {
  id: string;
  organizationId?: string;
  approvalType: string;
  approvalAction: string;
  transactionType?: TransactionType;
  rangeType?: RangeType;
  minAmount: number;
  maxAmount: number;
  currency?: string | null;
  sequencing?: Sequencing;
  approvalRequired?: boolean;
  signatoryGroupId?: string;
  signatoryGroupName?: string | null;
  conditionTree?: ConditionTreeNode | null;
  escalation?: RuleEscalation | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  status?: string;
}

export interface CreateApprovalRuleInput {
  approvalType: string;
  approvalAction: string;
  transactionType?: TransactionType;
  rangeType?: RangeType;
  minAmount: number;
  maxAmount: number;
  currency?: string;
  sequencing?: Sequencing;
  approvalRequired?: boolean;
  signatoryGroupId?: string;
  conditionTree?: ConditionTreeNode | null;
  escalation?: RuleEscalation | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

export interface SimulationRequest {
  approvalType: string;
  approvalAction: string;
  amount: number;
  currency?: string;
  transactionType?: TransactionType;
  at?: string;
  dailyTotal?: number;
  monthlyTotal?: number;
}

export interface SimulationInvolvedGroup {
  groupId: string;
  name: string;
  minApprovals: number;
  eligibleActiveMembers: number;
  sufficient: boolean;
}

export interface SimulationResponse {
  approvalRequired: boolean;
  ambiguous: boolean;
  matchedRuleId?: string;
  reason?: string;
  requiredCondition?: ConditionTreeNode;
  involvedGroups?: SimulationInvolvedGroup[];
}

export interface MatrixAuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  before?: unknown;
  after?: unknown;
  summary: string;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
}

export interface ApprovalPolicyTemplateRule {
  approvalType: string;
  approvalAction: string;
  transactionType?: TransactionType;
  rangeType?: RangeType;
  minAmount: number;
  maxAmount: number;
  currency?: string;
  sequencing?: Sequencing;
  approvalRequired?: boolean;
}

export interface ApprovalPolicyTemplate {
  code: string;
  name: string;
  description?: string;
  rules: ApprovalPolicyTemplateRule[];
}

export interface ApprovalFeature {
  code: string;
  label: string;
  approvalType: string;
  monetary: boolean;
}

export interface ApprovalTypesResponse {
  approvalTypes: Array<{ value: string; label: string }>;
  approvalActions: Array<{ value: string; label: string }>;
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
