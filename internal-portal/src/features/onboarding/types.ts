import type { OnboardingStatus } from "@/lib/constants";

export interface CustomerProfile {
  id: string;
  legalName: string;
  registrationNumber: string;
  industry: string;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: OnboardingStatus | "";
}

export interface CreateCustomerInput {
  legalName: string;
  registrationNumber: string;
  industry: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  onboardingStatus?: OnboardingStatus;
}
