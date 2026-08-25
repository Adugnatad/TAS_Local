import type { OnboardingStatus } from "@/lib/constants";

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface CustomerProfile {
  id: string;
  tin?: string;
  accounts: CustomerAccount[];
  businessLicense?: BusinessLicenseMetadata;
  name: string;
  address: string;
  phone: string;
  crmSystemId?: string;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAccount {
  accountNumber: string;
  isPrimary: boolean;
}

export interface BusinessLicenseMetadata {
  name: string;
  size: number;
  type: string;
}

export interface CustomerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: OnboardingStatus | "";
}

export interface CreateCustomerInput {
  tin?: string;
  accounts: CustomerAccount[];
  businessLicense?: BusinessLicenseMetadata;
  name: string;
  address: string;
  phone: string;
  crmSystemId?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  onboardingStatus?: OnboardingStatus;
}
