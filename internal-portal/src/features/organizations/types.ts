import type { OrgStatus, OrgUserRole, PermissionType, ValidationStatus } from "@/lib/constants";

export interface OrgAccount {
  id?: string;
  accountNo: string;
  currency: string;
  accountType: string;
  primary: boolean;
}

export interface OrgDocument {
  id: string;
  type?: string;
  fileName?: string;
  validationStatus?: ValidationStatus;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  tin: string | null;
  status: OrgStatus;
  tinValidationStatus: ValidationStatus;
  tinEnteredName?: string | null;
  tinRegisteredName?: string | null;
  tinNameMatchPercent?: number | null;
  crmSystemId?: string | null;
  cbsCustomerId?: string | null;
  assignedCseUserId?: string | null;
  assignedCseName?: string | null;
  assignedCseUsername?: string | null;
  assignedCseCrmSystemId?: string | null;
  effectiveDate?: string | null;
  expiryDate?: string | null;
  activeUsers?: number;
  accounts: number;
  createdAt: string;
}

export interface OrganizationDetail {
  id: string;
  name: string;
  tin: string | null;
  tinValidationStatus: ValidationStatus;
  tinValidationReason: string | null;
  tinEnteredName?: string | null;
  tinRegisteredName?: string | null;
  tinNameMatchPercent?: number | null;
  phone: string | null;
  address: string | null;
  crmSystemId: string | null;
  cbsCustomerId: string | null;
  assignedCseUserId?: string | null;
  assignedCseName?: string | null;
  assignedCseUsername?: string | null;
  assignedCseCrmSystemId?: string | null;
  status: OrgStatus;
  effectiveDate: string | null;
  expiryDate: string | null;
  description: string | null;
  createdBy: string | null;
  activeUsers: number;
  accounts: OrgAccount[];
  documents: OrgDocument[];
  warnings: string[];
}

export interface OrganizationWritePayload {
  name: string;
  tin?: string;
  phone?: string;
  address?: string;
  crmSystemId?: string;
  description?: string;
  effectiveDate?: string;
  expiryDate?: string;
  assignedCseUserId?: string;
  accounts?: Array<{
    accountNo: string;
    currency: string;
    accountType: string;
    primary: boolean;
  }>;
}

export interface OrganizationUser {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: OrgUserRole | string;
  permissionType: PermissionType | string;
  status: string;
}

export interface CreateOrgUserInput {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  role: OrgUserRole;
  permissionType: PermissionType;
}

export type UpdateOrgUserInput = Partial<
  Omit<CreateOrgUserInput, "username" | "password">
>;

export type OrgAccountInput = {
  accountNo: string;
  currency: string;
  accountType: string;
  primary: boolean;
};
