import { z } from "zod";

const businessLicenseSchema = z.object({
  name: z.string().min(1),
  size: z.number().nonnegative(),
  type: z.string().min(1),
});

const accountSchema = z.object({
  accountNumber: z.string().min(1, "Account number is required"),
  isPrimary: z.boolean(),
});

export const customerProfileSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  address: z.string().trim().min(1, "Address is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  tin: z.string().trim().optional(),
  crmSystemId: z.string().trim().optional(),
  businessLicense: businessLicenseSchema.optional(),
  accounts: z.array(accountSchema).min(1, "At least one account is required"),
});

export type CustomerProfileFormValues = z.infer<typeof customerProfileSchema>;
