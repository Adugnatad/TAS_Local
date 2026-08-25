import { z } from "zod";
import { ONBOARDING_STATUSES } from "@/lib/constants";

export const customerProfileSchema = z.object({
  tin: z.string().optional(),
  accounts: z
    .array(
      z.object({
        accountNumber: z.string().min(1, "Account is required"),
        isPrimary: z.boolean(),
      }),
    )
    .min(1, "At least one account is required")
    .refine((accounts) => accounts.filter((account) => account.isPrimary).length === 1, {
      message: "Select exactly one primary account",
      path: [0, "isPrimary"],
    }),
  businessLicense: z.object({ name: z.string(), size: z.number(), type: z.string() }).optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(2, "Address is required"),
  phone: z.string().min(7, "Phone number is required"),
  crmSystemId: z.string().optional(),
});

export const customerStatusUpdateSchema = z.object({
  onboardingStatus: z.enum(ONBOARDING_STATUSES),
});

export type CustomerProfileFormValues = z.infer<typeof customerProfileSchema>;
export type CustomerStatusUpdateValues = z.infer<typeof customerStatusUpdateSchema>;
