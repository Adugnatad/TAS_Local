import { z } from "zod";
import { ONBOARDING_STATUSES } from "@/lib/constants";

export const customerProfileSchema = z.object({
  legalName: z.string().min(2, "Legal name must be at least 2 characters"),
  registrationNumber: z
    .string()
    .min(3, "Registration number is required")
    .regex(/^[A-Z0-9-]+$/i, "Invalid registration number format"),
  industry: z.string().min(2, "Industry is required"),
});

export const customerStatusUpdateSchema = z.object({
  onboardingStatus: z.enum(ONBOARDING_STATUSES),
});

export type CustomerProfileFormValues = z.infer<typeof customerProfileSchema>;
export type CustomerStatusUpdateValues = z.infer<typeof customerStatusUpdateSchema>;
