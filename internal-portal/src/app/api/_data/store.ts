import { customersFixture } from "@/features/onboarding/mocks/fixtures";
import type { CustomerProfile } from "@/features/onboarding/types";
import {
  signatoriesFixture,
  signatoryRulesFixture,
} from "@/features/signatory-matrix/mocks/fixtures";
import type { Signatory, SignatoryRule } from "@/features/signatory-matrix/types";
import { requestsFixture } from "@/features/status-viewer/mocks/fixtures";
import type { RequestStatusSummary } from "@/features/status-viewer/types";

export const customers: CustomerProfile[] = [...customersFixture];
export const signatories: Signatory[] = [...signatoriesFixture];
export const signatoryRules: SignatoryRule[] = [...signatoryRulesFixture];
export const requests: RequestStatusSummary[] = [...requestsFixture];

export function now(): string {
  return new Date().toISOString();
}
