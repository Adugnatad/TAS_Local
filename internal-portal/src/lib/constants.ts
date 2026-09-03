export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const OFFICER_ROLES = ["officer", "supervisor", "admin"] as const;
export type OfficerRole = (typeof OFFICER_ROLES)[number];

export const CAPABILITIES = [
  "onboarding.approve",
  "signatories.manage",
  "rules.manage",
  "settings.manage",
  "users.manage",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<OfficerRole, Capability[]> = {
  officer: ["signatories.manage"],
  supervisor: ["onboarding.approve", "signatories.manage", "rules.manage", "settings.manage"],
  admin: [
    "onboarding.approve",
    "signatories.manage",
    "rules.manage",
    "settings.manage",
    "users.manage",
  ],
};

export const ONBOARDING_STATUSES = ["draft", "pending_review", "approved", "rejected"] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export const PERMISSION_LABELS: Record<string, string> = {
  MANAGE_EMPLOYEES: "Manage employees",
  MANAGE_ROLES: "Manage roles",
  MANAGE_PERMISSIONS: "Manage permissions",
  MANAGE_ORGANIZATIONS: "Manage organizations",
  VIEW_ORGANIZATIONS: "View organizations",
  MANAGE_SIGNATORY_ANY: "Configure any signatory matrix",
  MANAGE_SIGNATORY_OWN: "Configure own signatory matrix",
  MANAGE_OWN_ORG: "Manage own organization",
};

export const ORG_STATUSES = ["ACTIVE", "SUSPENDED", "TERMINATED"] as const;
export type OrgStatus = (typeof ORG_STATUSES)[number];

export const VALIDATION_STATUSES = ["PENDING", "VALIDATED", "NOT_VALIDATED"] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export const ORG_ROLES = ["Admin", "User"] as const;
export type OrgUserRole = (typeof ORG_ROLES)[number];

export const PERMISSION_TYPES = ["INITIATE", "APPROVE", "VIEW"] as const;
export type PermissionType = (typeof PERMISSION_TYPES)[number];

export const ROLE_SCOPES = ["EMPLOYEE", "ORGANIZATION"] as const;
export type RoleScope = (typeof ROLE_SCOPES)[number];

export const APPROVAL_TYPES = [
  "LOAN_APPLICATION",
  "TRADE_REQUEST",
  "FUND_TRANSFER",
  "RTGS",
] as const;
export const APPROVAL_ACTIONS = ["CREATE"] as const;

export const DOCUMENT_TYPES = ["BUSINESS_LICENSE", "Other"] as const;

export const NAV_ITEMS: Array<{
  href: string;
  label: string;
  permissions: readonly string[];
}> = [
  {
    href: "/organizations",
    label: "Contracts",
    permissions: ["VIEW_ORGANIZATIONS", "MANAGE_ORGANIZATIONS"],
  },
  // { href: "/status", label: "Status", permissions: ["VIEW_ORGANIZATIONS", "MANAGE_ORGANIZATIONS"] },
  { href: "/employees", label: "Employees", permissions: ["MANAGE_EMPLOYEES"] },
  // { href: "/engineer-tasks", label: "Engineer", permissions: [] },
  {
    href: "/roles",
    label: "Roles",
    permissions: ["MANAGE_ROLES", "MANAGE_PERMISSIONS", "MANAGE_EMPLOYEES", "MANAGE_ORGANIZATIONS"],
  },
  { href: "/profile", label: "Profile", permissions: [] },
];
