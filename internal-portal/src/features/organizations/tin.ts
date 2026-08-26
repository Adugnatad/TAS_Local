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

export function formatOrgApiError(error: unknown, fallback = "Request failed."): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === "ORG_NAME_EXISTS") return "An organization with this name already exists.";
  if (error.code === "ORG_TIN_EXISTS") return "An organization with this TIN already exists.";
  if (error.code === "ORG_PHONE_EXISTS") return "An organization with this phone already exists.";
  if (error.code === "ORG_NOT_VERIFIED") {
    return "TIN is not verified. Run verify-tin or team verification before submitting to CoopStream.";
  }
  if (error.code === "ORG_CSE_REQUIRED") {
    return "A CSE must be assigned before adding users.";
  }
  if (error.code === "NOT_A_CSE") return "Selected user is not a BankCSE employee.";
  if (error.code === "CSE_INACTIVE") return "Selected CSE is not active.";
  if (error.code === "TERMINATED") return "Cannot assign a CSE to a terminated organization.";
  if (error.code === "CRM_ID_REQUIRED") return "CRM system ID is required for BankCSE employees.";
  if (error.code === "CRM_ID_EXISTS") return "This CRM system ID is already in use.";
  return error.message;
}

