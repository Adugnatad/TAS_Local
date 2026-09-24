import type { OrganizationDetail, OrganizationSummary } from "./types";
import { ApiError } from "@/lib/api-client";

export function tinVerificationLabel(
  org: Pick<OrganizationDetail | OrganizationSummary, "tinValidationStatus"> & {
    tinRegisteredName?: string | null;
  },
): { status: string; label: string } {
  const status = org.tinValidationStatus;
  if (status === "VALIDATED") {
    return {
      status,
      label: org.tinRegisteredName ? "Verified" : "Verified by team",
    };
  }
  if (status === "NOT_VALIDATED" && org.tinRegisteredName) {
    return { status: "NAME_MISMATCH", label: "Name mismatch" };
  }
  return { status: status || "PENDING", label: "Not verified" };
}

export function canAddOrgUsers(
  org: Pick<OrganizationDetail, "assignedCseUserId" | "tinValidationStatus"> | null | undefined,
): { ok: boolean; reason?: string } {
  if (!org) return { ok: false, reason: "Organization is still loading." };
  if (!org.assignedCseUserId) {
    return { ok: false, reason: "A CSE must be assigned before adding users." };
  }
  if (org.tinValidationStatus !== "VALIDATED") {
    return {
      ok: false,
      reason:
        "Organization TIN must be validated (verify-tin or team verification) before adding users.",
    };
  }
  return { ok: true };
}

export function formatOrgApiError(error: unknown, fallback = "Request failed."): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === "ORG_NAME_EXISTS") return "An organization with this name already exists.";
  if (error.code === "ORG_TIN_EXISTS") return "An organization with this TIN already exists.";
  if (error.code === "ORG_PHONE_EXISTS") return "An organization with this phone already exists.";
  if (error.code === "ORG_NOT_VERIFIED") {
    return "TIN is not verified. Run verify-tin or team verification before submitting to CoopStream.";
  }
  if (error.code === "ORG_NOT_VALIDATED") {
    return "Organization is not validated yet. Verify the TIN (and business license) before adding users.";
  }
  if (error.code === "ORG_CSE_REQUIRED") {
    return "A CSE must be assigned before adding users.";
  }
  if (error.code === "NOT_A_CSE") return "Selected user is not a BankCSE employee.";
  if (error.code === "CSE_INACTIVE") return "Selected CSE is not active.";
  if (error.code === "TERMINATED") return "Cannot assign a CSE to a terminated organization.";
  if (error.code === "CRM_ID_EXISTS") return "This CRM system ID is already in use.";
  if (error.code === "DOCUMENT_TYPE_REQUIRED") return "Document type is required.";
  if (error.code === "UNKNOWN_DOCUMENT_TYPE") return "Unknown document type.";
  if (error.code === "DOCUMENT_NAME_REQUIRED") {
    return "Document name is required when type is Other.";
  }
  if (error.code === "UNSUPPORTED_TYPE") return "Unsupported file type.";
  if (error.code === "FILE_TOO_LARGE") return "File is too large.";
  if (error.code === "EMPTY_FILE") return "File is empty.";
  if (error.code === "ACCOUNT_REQUIRED") return "Account number is required.";
  if (error.code === "CUSTOMER_ID_REQUIRED") return "Customer ID from account lookup is required.";
  if (error.code === "CBS_ACCOUNT_NOT_FOUND") return "Account not found in core banking.";
  if (error.code === "CBS_CUSTOMER_MISMATCH") {
    return "A selected account belongs to a different customer. This attempt has been audited.";
  }
  if (error.code === "SEGMENT_REQUIRED") return "Select a segment for this organization.";
  if (error.code === "FORM_OF_BUSINESS_REQUIRED") return "Select a form of business.";
  if (error.code === "TOO_MANY_ACCOUNTS") {
    return "Select at most 20 accounts. Register the rest after creation.";
  }
  if (error.code === "ACCOUNT_LINKED_TO_ANOTHER_ORG") {
    return "That account is already registered to another organization.";
  }
  if (error.code === "VALIDATION_FAILED" && error.fieldErrors?.length) {
    return error.fieldErrors.map((fe) => `${fe.field}: ${fe.message}`).join(" · ");
  }
  return error.message;
}
