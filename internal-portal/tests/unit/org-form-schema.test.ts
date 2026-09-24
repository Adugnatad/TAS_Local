import { describe, expect, it } from "vitest";
import {
  orgCreateFormSchema,
  orgFormSchema,
  validateAccountSelection,
} from "@/features/organizations/schemas";
import { MAX_SELECTED_ACCOUNTS } from "@/features/organizations/constants";

const validCreate = {
  name: "Acme Trading PLC",
  formOfBusiness: "PARTNERSHIPS_PLC",
  segment: "Horticulture",
  accountNo: "1022200133177",
};

describe("orgCreateFormSchema", () => {
  it("accepts valid create payload", () => {
    expect(orgCreateFormSchema.safeParse(validCreate).success).toBe(true);
  });

  it("requires segment on create", () => {
    const result = orgCreateFormSchema.safeParse({ ...validCreate, segment: "" });
    expect(result.success).toBe(false);
  });

  it("requires formOfBusiness enum on create", () => {
    const result = orgCreateFormSchema.safeParse({
      ...validCreate,
      formOfBusiness: "Partnerships/plc",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all segment display values", () => {
    for (const segment of [
      "Horticulture",
      "Governmental",
      "Foreign direct investment",
      "NGO and developmental organizations",
    ]) {
      expect(orgCreateFormSchema.safeParse({ ...validCreate, segment }).success).toBe(true);
    }
  });
});

describe("orgFormSchema (edit)", () => {
  it("allows empty segment on edit", () => {
    expect(orgFormSchema.safeParse({ ...validCreate, segment: "" }).success).toBe(true);
  });
});

describe("validateAccountSelection", () => {
  it("requires at least one account", () => {
    expect(validateAccountSelection([])).toMatch(/at least one/i);
  });

  it("rejects more than max accounts", () => {
    const many = Array.from({ length: MAX_SELECTED_ACCOUNTS + 1 }, (_, i) => String(i));
    expect(validateAccountSelection(many)).toMatch(/at most/i);
  });

  it("accepts valid selection", () => {
    expect(validateAccountSelection(["1022200133177"])).toBeNull();
  });
});
