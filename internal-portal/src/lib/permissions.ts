export const PERMISSIONS = [
  "MANAGE_EMPLOYEES",
  "MANAGE_ROLES",
  "MANAGE_PERMISSIONS",
  "MANAGE_ORGANIZATIONS",
  "VIEW_ORGANIZATIONS",
  "MANAGE_SIGNATORY_ANY",
  "MANAGE_SIGNATORY_OWN",
  "MANAGE_OWN_ORG",
  "ACKNOWLEDGE_RTGS",
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number];

export function hasPermission(
  granted: readonly string[] | undefined,
  code: PermissionCode | string,
): boolean {
  return Boolean(granted?.includes(code));
}

export function hasAnyPermission(
  granted: readonly string[] | undefined,
  codes: readonly string[],
): boolean {
  return codes.some((code) => hasPermission(granted, code));
}
