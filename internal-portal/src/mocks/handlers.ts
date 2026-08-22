import { authHandlers } from "@/features/auth/mocks/handlers";
import { onboardingHandlers } from "@/features/onboarding/mocks/handlers";
import { signatoryMatrixHandlers } from "@/features/signatory-matrix/mocks/handlers";
import { statusViewerHandlers } from "@/features/status-viewer/mocks/handlers";

export const handlers = [
  ...authHandlers,
  ...onboardingHandlers,
  ...signatoryMatrixHandlers,
  ...statusViewerHandlers,
];
