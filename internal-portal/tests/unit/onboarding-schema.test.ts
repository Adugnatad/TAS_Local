import { describe, expect, it } from "vitest";
import { customerProfileSchema } from "@/features/onboarding/schemas";

describe("customerProfileSchema", () => {
  it("validates a correct customer profile", () => {
    const result = customerProfileSchema.safeParse({
      name: "Acme Corp",
      address: "1 Corporate Avenue",
      phone: "+63 917 555 0100",
      accounts: [{ accountNumber: "001-123", isPrimary: true }],
    });
    expect(result.success).toBe(true);
  });

  it("requires exactly one primary account", () => {
    const result = customerProfileSchema.safeParse({
      name: "Acme Corp",
      address: "1 Corporate Avenue",
      phone: "+63 917 555 0100",
      accounts: [{ accountNumber: "001-123", isPrimary: false }],
    });
    expect(result.success).toBe(false);
  });

  it("does not block an invalid optional TIN", () => {
    const result = customerProfileSchema.safeParse({
      name: "Acme Corp",
      address: "1 Corporate Avenue",
      phone: "+63 917 555 0100",
      tin: "not-yet-available",
      accounts: [{ accountNumber: "001-123", isPrimary: true }],
    });
    expect(result.success).toBe(true);
  });
});
