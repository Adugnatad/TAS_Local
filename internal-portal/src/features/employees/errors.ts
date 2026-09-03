import { ApiError } from "@/lib/api-client";

export function formatEmployeeApiError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === "CRM_ID_REQUIRED") return "CRM system ID is required for BankCSE employees.";
  if (error.code === "CRM_ID_EXISTS") {
    return "This CRM system ID is already assigned to another user.";
  }
  if (error.code === "ENGINEER_ID_REQUIRED") {
    return "Engineer system ID is required for BankEngineer employees.";
  }
  if (error.code === "ENGINEER_ID_EXISTS") {
    return "This engineer system ID is already assigned to another user.";
  }
  if (error.code === "CSE_NOT_VALIDATED") {
    return "CRM system ID was not validated against CoopStream.";
  }
  if (error.code === "ENGINEER_NOT_VALIDATED") {
    return "Engineer system ID was not validated against CoopStream.";
  }
  if (error.code === "SYSTEM_ID_REQUIRED") return "System ID is required for verification.";
  if (error.code === "USERNAME_TAKEN") return "That username is already taken.";
  if (error.code === "UNKNOWN_ROLE") return "One or more selected roles are unknown.";
  return error.message || fallback;
}
