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
  requiredRoles?: string[];
  amountThreshold: number;
}

export interface CreateSignatoryInput {
  fullName: string;
  role: string;
  signatureLimit: number;
  isActive?: boolean;
}

export type UpdateSignatoryInput = Partial<CreateSignatoryInput>;

export interface CreateSignatoryRuleInput {
  minSignatories: number;
  requiredRoles?: string[];
  amountThreshold: number;
}

export type UpdateSignatoryRuleInput = Partial<CreateSignatoryRuleInput>;

export interface MatrixPreviewInput {
  amount: number;
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
