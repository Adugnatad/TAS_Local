import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCustomer, fetchCustomers, updateCustomer } from "@/lib/apis/customer_apis";
import type {
  CreateCustomerInput,
  CustomerListParams,
  UpdateCustomerInput,
} from "../../../lib/types";

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params: CustomerListParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => fetchCustomers(params),
  });
}

export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => fetchCustomer(customerId),
    enabled: !!customerId,
  });
}

export async function CreateCustomer(input: CreateCustomerInput) {
  const response = await fetch(`/api/customers`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
}

export function useUpdateCustomer(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => updateCustomer(customerId, input),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.detail(customerId), data);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}
