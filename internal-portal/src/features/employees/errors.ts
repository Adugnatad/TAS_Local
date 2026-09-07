import { ApiError } from "@/lib/api-client";

export function formatEmployeeApiError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === "EMAIL_REQUIRED") return "Email is required for CSE or engineer employees.";
  if (error.code === "CRM_ID_EXISTS") {
    return "This CRM system ID is already assigned to another user.";
  }
  if (error.code === "ENGINEER_ID_EXISTS") {
    return "This engineer system ID is already assigned to another user.";
  }
  if (error.code === "CSE_NOT_VALIDATED") {
    return "CSE email was not validated against CoopStream and eTrade.";
  }
  if (error.code === "ENGINEER_NOT_VALIDATED") {
    return "Engineer email was not validated against CoopStream.";
  }
  if (error.code === "USERNAME_TAKEN") return "That username is already taken.";
  if (error.code === "UNKNOWN_ROLE") return "One or more selected roles are unknown.";
  return error.message || fallback;
}
