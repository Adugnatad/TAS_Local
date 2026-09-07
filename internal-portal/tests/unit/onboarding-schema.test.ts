import { describe, expect, it } from "vitest";
import { z } from "zod";
import { orgFormSchema } from "@/features/organizations/schemas";
import { employeeFormSchema } from "@/features/employees/schemas";

describe("orgFormSchema", () => {
  it("requires a name", () => {
    const result = orgFormSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid organization payload", () => {
    const result = orgFormSchema.safeParse({
      name: "Acme Trading PLC",
      tin: "1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("accepts the FCY selling-price preference", () => {
    expect(
      orgFormSchema.safeParse({
        name: "Acme Trading PLC",
        alwaysUseSellingPriceForFCYConvertion: true,
      }).success,
    ).toBe(true);
  });
});

describe("login schema shape", () => {
  const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  });

  it("rejects empty credentials", () => {
    expect(loginSchema.safeParse({ username: "", password: "" }).success).toBe(false);
  });

  it("accepts username and password", () => {
    expect(loginSchema.safeParse({ username: "admin", password: "ChangeMe123!" }).success).toBe(
      true,
    );
  });
});

describe("employeeFormSchema", () => {
  const baseValues = {
    username: "cse.jane",
    password: "CsePassw0rd!",
    firstName: "Jane",
    lastName: "Doe",
    roleNames: ["BankCSE"],
  };

  it("requires email for CSE and engineer roles", () => {
    expect(employeeFormSchema.safeParse(baseValues).success).toBe(false);
    expect(
      employeeFormSchema.safeParse({ ...baseValues, roleNames: ["BankEngineer"] }).success,
    ).toBe(false);
  });

  it("allows optional system ID metadata when email is present", () => {
    expect(
      employeeFormSchema.safeParse({
        ...baseValues,
        email: "jane.cse@coopbank.et",
        crmSystemId: "CRM-0001",
      }).success,
    ).toBe(true);
  });
});
