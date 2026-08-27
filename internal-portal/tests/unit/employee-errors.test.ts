import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-client";

function formatEmployeeApiError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === "CRM_ID_REQUIRED") return "CRM system ID is required for BankCSE employees.";
  if (error.code === "CRM_ID_EXISTS") {
    return "This CRM system ID is already assigned to another user.";
  }
  if (error.code === "USERNAME_TAKEN") return "That username is already taken.";
  if (error.code === "UNKNOWN_ROLE") return "One or more selected roles are unknown.";
  return error.message || fallback;
}

describe("employee error mapping", () => {
  it("maps username and role codes", () => {
    expect(formatEmployeeApiError(new ApiError(409, "x", "USERNAME_TAKEN"), "fail")).toMatch(
      /taken/i,
    );
    expect(formatEmployeeApiError(new ApiError(400, "x", "UNKNOWN_ROLE"), "fail")).toMatch(
      /unknown/i,
    );
  });
});
