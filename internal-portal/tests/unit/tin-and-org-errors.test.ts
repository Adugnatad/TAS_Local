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

  it("maps CBS account errors", () => {
    expect(formatOrgApiError(new ApiError(400, "x", "ACCOUNT_REQUIRED"))).toMatch(/account number/i);
    expect(formatOrgApiError(new ApiError(400, "x", "CUSTOMER_ID_REQUIRED"))).toMatch(/customer id/i);
    expect(formatOrgApiError(new ApiError(400, "x", "CBS_ACCOUNT_NOT_FOUND"))).toMatch(/not found/i);
    expect(formatOrgApiError(new ApiError(400, "x", "CBS_CUSTOMER_MISMATCH"))).toMatch(/audited/i);
  });

  it("maps registration error codes", () => {
    expect(formatOrgApiError(new ApiError(400, "x", "SEGMENT_REQUIRED"))).toMatch(/segment/i);
    expect(formatOrgApiError(new ApiError(400, "x", "FORM_OF_BUSINESS_REQUIRED"))).toMatch(
      /form of business/i,
    );
    expect(formatOrgApiError(new ApiError(400, "x", "TOO_MANY_ACCOUNTS"))).toMatch(/20 accounts/i);
    expect(formatOrgApiError(new ApiError(409, "x", "ACCOUNT_LINKED_TO_ANOTHER_ORG"))).toMatch(
      /another organization/i,
    );
  });

  it("surfaces VALIDATION_FAILED field errors", () => {
    const error = new ApiError(400, "Validation failed", "VALIDATION_FAILED", [
      { field: "tin", message: "must be 10 digits" },
    ]);
    expect(formatOrgApiError(error)).toBe("tin: must be 10 digits");
  });
});
