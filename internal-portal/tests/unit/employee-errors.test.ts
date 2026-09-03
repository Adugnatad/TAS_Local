import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-client";
import { formatEmployeeApiError } from "@/features/employees/errors";

describe("employee error mapping", () => {
  it("maps username and role codes", () => {
    expect(formatEmployeeApiError(new ApiError(409, "x", "USERNAME_TAKEN"), "fail")).toMatch(
      /taken/i,
    );
    expect(formatEmployeeApiError(new ApiError(400, "x", "UNKNOWN_ROLE"), "fail")).toMatch(
      /unknown/i,
    );
  });

  it("maps engineer and validation codes", () => {
    expect(
      formatEmployeeApiError(new ApiError(400, "x", "ENGINEER_ID_REQUIRED"), "fail"),
    ).toMatch(/engineer system id/i);
    expect(
      formatEmployeeApiError(new ApiError(409, "x", "ENGINEER_ID_EXISTS"), "fail"),
    ).toMatch(/already assigned/i);
    expect(
      formatEmployeeApiError(new ApiError(400, "x", "CSE_NOT_VALIDATED"), "fail"),
    ).toMatch(/not validated/i);
    expect(
      formatEmployeeApiError(new ApiError(400, "x", "ENGINEER_NOT_VALIDATED"), "fail"),
    ).toMatch(/not validated/i);
    expect(
      formatEmployeeApiError(new ApiError(400, "x", "SYSTEM_ID_REQUIRED"), "fail"),
    ).toMatch(/required for verification/i);
  });
});
