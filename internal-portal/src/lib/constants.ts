export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const OFFICER_ROLES = ["officer", "supervisor", "admin"] as const;
export type OfficerRole = (typeof OFFICER_ROLES)[number];

export const ONBOARDING_STATUSES = ["draft", "pending_review", "approved", "rejected"] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const REQUEST_TYPES = ["loan", "trade"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUSES = ["in_progress", "completed", "rejected", "on_hold"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STAGES = [
  "Public Request",
  "Signatory Check",
  "CoopStream Processing",
  "TSS Execution",
  "CRM Sync",
  "Completed",
] as const;
export type RequestStage = (typeof REQUEST_STAGES)[number];

export const LOAN_STAGES: RequestStage[] = [
  "Public Request",
  "Signatory Check",
  "CoopStream Processing",
  "CRM Sync",
  "Completed",
];

export const TRADE_STAGES: RequestStage[] = [
  "Public Request",
  "Signatory Check",
  "TSS Execution",
  "CRM Sync",
  "Completed",
];

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
  on_hold: "On Hold",
};

export const ROLE_LABELS: Record<OfficerRole, string> = {
  officer: "Officer",
  supervisor: "Supervisor",
  admin: "Administrator",
};

export const CAPABILITIES = [
  "onboarding.approve",
  "signatories.manage",
  "rules.manage",
  "settings.manage",
  "users.manage",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_LABELS: Record<Capability, string> = {
  "onboarding.approve": "Approve / reject onboarding",
  "signatories.manage": "Manage customer signatories",
  "rules.manage": "Manage signatory rules",
  "settings.manage": "Edit signatory settings",
  "users.manage": "Manage portal users",
};

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

export const NAV_ITEMS: Array<{
  href: string;
  label: string;
  roles: readonly OfficerRole[];
}> = [
  { href: "/onboarding", label: "Organization Onboarding", roles: OFFICER_ROLES },
  { href: "/signatory-matrix", label: "Signatory Matrix", roles: OFFICER_ROLES },
  { href: "/status", label: "Status Viewer", roles: OFFICER_ROLES },
  { href: "/users", label: "Users", roles: ["admin"] },
  { href: "/settings", label: "Settings", roles: ["supervisor", "admin"] },
];
