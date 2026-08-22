import { describe, expect, it } from "vitest";
import { customerProfileSchema } from "@/features/onboarding/schemas";

describe("customerProfileSchema", () => {
  it("validates a correct customer profile", () => {
    const result = customerProfileSchema.safeParse({
      legalName: "Acme Corp",
      registrationNumber: "REG-2024-1001",
      industry: "Manufacturing",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid registration number", () => {
    const result = customerProfileSchema.safeParse({
      legalName: "Acme Corp",
      registrationNumber: "invalid reg!",
      industry: "Manufacturing",
    });
    expect(result.success).toBe(false);
  });
});
