export interface SessionUser {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  userType: "EMPLOYEE" | "ORGANIZATION" | string;
  roles: string[];
  permissions: string[];
  /** Full organization object for org users; null for employees. */
  organization: unknown | null;
  permissionType: string | null;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function displayName(user: Pick<SessionUser, "firstName" | "lastName" | "username">): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.username;
}
