export const matrixKeys = {
  groups: (orgId: string) => ["signatory", orgId, "groups"] as const,
  members: (orgId: string, groupId: string) => ["signatory", orgId, "members", groupId] as const,
  rules: (orgId: string, params?: unknown) => ["signatory", orgId, "rules", params ?? {}] as const,
};
