import { describe, expect, it } from "vitest";
import { canAddOrgUsers, formatOrgApiError, tinVerificationLabel } from "@/features/organizations/tin";
import { ApiError } from "@/lib/api-client";

describe("tinVerificationLabel", () => {
  it("labels validated with registry name as Verified", () => {
    expect(
      tinVerificationLabel({
        tinValidationStatus: "VALIDATED",
        tinRegisteredName: "Acme PLC",
      }),
    ).toEqual({ status: "VALIDATED", label: "Verified" });
  });

  it("labels validated without registry name as Verified by team", () => {
    expect(
      tinVerificationLabel({
        tinValidationStatus: "VALIDATED",
        tinRegisteredName: null,
      }),
    ).toEqual({ status: "VALIDATED", label: "Verified by team" });
  });

  it("labels name mismatch", () => {
    expect(
      tinVerificationLabel({
        tinValidationStatus: "NOT_VALIDATED",
        tinRegisteredName: "Other PLC",
      }),
    ).toEqual({ status: "NAME_MISMATCH", label: "Name mismatch" });
  });
});

describe("canAddOrgUsers", () => {
  it("requires CSE and VALIDATED", () => {
    expect(
      canAddOrgUsers({
        assignedCseUserId: null,
        tinValidationStatus: "VALIDATED",
      }).ok,
    ).toBe(false);
    expect(
      canAddOrgUsers({
        assignedCseUserId: "cse-1",
        tinValidationStatus: "PENDING",
      }).ok,
    ).toBe(false);
    expect(
      canAddOrgUsers({
        assignedCseUserId: "cse-1",
        tinValidationStatus: "VALIDATED",
      }).ok,
    ).toBe(true);
  });
});

describe("formatOrgApiError", () => {
  it("maps ORG_NOT_VALIDATED and document errors", () => {
    expect(formatOrgApiError(new ApiError(409, "x", "ORG_NOT_VALIDATED"))).toMatch(/not validated/i);
    expect(formatOrgApiError(new ApiError(400, "x", "DOCUMENT_NAME_REQUIRED"))).toMatch(/Other/i);
  });
});
