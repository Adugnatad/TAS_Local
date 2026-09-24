import type { OrgStatus, OrgUserRole, PermissionType, ValidationStatus } from "@/lib/constants";

export interface OrgAccount {
  id?: string;
  accountNo: string;
  currency: string | null;
  accountType: string | null;
  primary: boolean;
  selected?: boolean;
  accountStatus?: string | null;
  productName?: string | null;
  branch?: string | null;
  holderName?: string | null;
  iban?: string | null;
  infoFetchedAt?: string | null;
}

export interface OrgDocument {
  id: string;
  type?: string;
  docType?: string;
  documentName?: string | null;
  fileName?: string;
  validationStatus?: ValidationStatus;
  source?: string | null;
  uploadedByName?: string | null;
  url?: string | null;
  version?: number | null;
  current?: boolean;
}

export interface DocumentTypeOption {
  code: string;
  label: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  formOfBusiness?: string | null;
  segment?: string | null;
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
  formOfBusiness: string | null;
  segment: string | null;
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
  alwaysUseSellingPriceForFCYConvertion?: boolean;
  alwaysUseBuyingPriceForFCYConversion?: boolean;
  createdBy: string | null;
  activeUsers: number;
  accounts: OrgAccount[];
  documents: OrgDocument[];
  warnings: string[];
}

export interface OrganizationWritePayload {
  name: string;
  businessLicenseNames?: string[];
  formOfBusiness?: string;
  segment?: string;
  tin?: string;
  phone?: string;
  address?: string;
  description?: string;
  effectiveDate?: string;
  expiryDate?: string;
  assignedCseUserId?: string;
  alwaysUseSellingPriceForFCYConvertion?: boolean;
  alwaysUseBuyingPriceForFCYConversion?: boolean;
  accountNumber?: string;
  customerId?: string;
  accountNumbers?: string[];
  accounts?: Array<{
    accountNo: string;
    currency: string;
    accountType: string;
    primary: boolean;
  }>;
}

export interface AccountLookupAccount {
  accountNo: string;
  currency: string | null;
  accountType: string | null;
  status: string | null;
}

export interface AccountLookupResponse {
  found: boolean;
  accountNumber?: string;
  customerId?: string;
  customerName?: string;
  accounts?: AccountLookupAccount[];
  listingComplete?: boolean;
}

export interface LinkableAccount {
  accountNo: string;
  currency?: string | null;
  accountType?: string | null;
  status?: string | null;
  alreadyLinked: boolean;
}

export interface LinkableAccountsResponse {
  accounts: LinkableAccount[];
  listingComplete: boolean;
}

export interface OrganizationUser {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
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

export type UpdateOrgUserInput = Partial<Omit<CreateOrgUserInput, "username" | "password">>;

export type OrgAccountInput = {
  accountNo: string;
  currency: string;
  accountType: string;
  primary: boolean;
};
