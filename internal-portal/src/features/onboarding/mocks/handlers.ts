import { http, HttpResponse } from "msw";
import { randomDelay } from "@/lib/utils";
import type { PaginatedResponse } from "@/types/global";
import type { CustomerProfile } from "../types";
import { customersFixture, getCustomerById } from "./fixtures";

let customers = [...customersFixture];

const SIMULATE_ERRORS = false;

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

export const onboardingHandlers = [
  http.get("/api/customers", async ({ request }) => {
    await randomDelay();
    if (SIMULATE_ERRORS && Math.random() < 0.05) {
      return HttpResponse.json({ message: "Failed to fetch customers" }, { status: 500 });
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const status = url.searchParams.get("status") ?? "";

    let filtered = [...customers];
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.legalName.toLowerCase().includes(search) ||
          c.registrationNumber.toLowerCase().includes(search) ||
          c.industry.toLowerCase().includes(search),
      );
    }
    if (status) {
      filtered = filtered.filter((c) => c.onboardingStatus === status);
    }

    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  http.get("/api/customers/:customerId", async ({ params }) => {
    await randomDelay();
    const customer = getCustomerById(String(params.customerId)) ?? customers.find((c) => c.id === params.customerId);
    if (!customer) {
      return HttpResponse.json({ message: "Customer not found" }, { status: 404 });
    }
    return HttpResponse.json(customer);
  }),

  http.post("/api/customers", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Omit<CustomerProfile, "id" | "createdAt" | "updatedAt" | "onboardingStatus">;
    const now = new Date().toISOString();
    const newCustomer: CustomerProfile = {
      id: `cust-${String(customers.length + 1).padStart(3, "0")}`,
      ...body,
      onboardingStatus: "draft",
      createdAt: now,
      updatedAt: now,
    };
    customers = [newCustomer, ...customers];
    return HttpResponse.json(newCustomer, { status: 201 });
  }),

  http.put("/api/customers/:customerId", async ({ params, request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<CustomerProfile>;
    const index = customers.findIndex((c) => c.id === params.customerId);
    if (index === -1) {
      return HttpResponse.json({ message: "Customer not found" }, { status: 404 });
    }
    customers[index] = {
      ...customers[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(customers[index]);
  }),
];

export function resetOnboardingMocks() {
  customers = [...customersFixture];
}
