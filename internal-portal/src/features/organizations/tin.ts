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
  return error.message;
}

