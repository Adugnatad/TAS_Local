export const FORM_OF_BUSINESS_OPTIONS = [
  { value: "COOPERATIVES", label: "Cooperatives" },
  { value: "INDIVIDUAL_SOLE", label: "Individual/Sole" },
  { value: "PARTNERSHIPS_PLC", label: "Partnerships/plc" },
  { value: "COOPERATIONS_SHARE_COMPANIES", label: "Cooperations/Share companies" },
] as const;

export const SEGMENT_OPTIONS = [
  { value: "Horticulture", label: "Horticulture" },
  { value: "Governmental", label: "Governmental" },
  { value: "Foreign direct investment", label: "Foreign direct investment" },
  { value: "NGO and developmental organizations", label: "NGO and developmental organizations" },
] as const;

/** Map legacy display strings stored on older orgs to backend enum constants. */
export const LEGACY_FORM_OF_BUSINESS_MAP: Record<string, string> = {
  Cooperatives: "COOPERATIVES",
  "Individual/Sole": "INDIVIDUAL_SOLE",
  "Partnerships/plc": "PARTNERSHIPS_PLC",
  "Cooperations/Share companies": "COOPERATIONS_SHARE_COMPANIES",
};

export function normalizeFormOfBusiness(value: string | null | undefined): string {
  if (!value) return "";
  if (FORM_OF_BUSINESS_OPTIONS.some((opt) => opt.value === value)) return value;
  return LEGACY_FORM_OF_BUSINESS_MAP[value] ?? value;
}

export const MAX_SELECTED_ACCOUNTS = 20;
