import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/global";
import type {
  CreateCustomerInput,
  CustomerListParams,
  CustomerProfile,
  UpdateCustomerInput,
} from "./types";

export async function fetchCustomers(
  params: CustomerListParams = {},
): Promise<PaginatedResponse<CustomerProfile>> {
  return apiClient<PaginatedResponse<CustomerProfile>>("/customers", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function fetchCustomer(customerId: string): Promise<CustomerProfile> {
  return apiClient<CustomerProfile>(`/customers/${customerId}`);
}

export async function createCustomer(input: CreateCustomerInput): Promise<CustomerProfile> {
  return apiClient<CustomerProfile>("/customers", {
    method: "POST",
    body: input,
  });
}

export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerInput,
): Promise<CustomerProfile> {
  return apiClient<CustomerProfile>(`/customers/${customerId}`, {
    method: "PUT",
    body: input,
  });
}
