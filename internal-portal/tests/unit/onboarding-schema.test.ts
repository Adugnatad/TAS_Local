import { describe, expect, it } from "vitest";
import { z } from "zod";
import { orgFormSchema } from "@/features/organizations/schemas";

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
});

describe("login schema shape", () => {
  const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  });

  it("rejects empty credentials", () => {
    expect(loginSchema.safeParse({ username: "", password: "" }).success).toBe(false);
  });
});
