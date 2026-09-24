import { z } from "zod";
import { FORM_OF_BUSINESS_OPTIONS, MAX_SELECTED_ACCOUNTS, SEGMENT_OPTIONS } from "./constants";

const formOfBusinessValues: string[] = FORM_OF_BUSINESS_OPTIONS.map((opt) => opt.value);
const segmentValues: string[] = SEGMENT_OPTIONS.map((opt) => opt.value);

export const orgFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  formOfBusiness: z
    .string()
    .refine(
      (value) => value === "" || formOfBusinessValues.includes(value),
      "Select a valid form of business",
    ),
  segment: z
    .string()
    .refine((value) => value === "" || segmentValues.includes(value), "Select a valid segment"),
  tin: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  assignedCseUserId: z.string().optional(),
  alwaysUseSellingPriceForFCYConvertion: z.boolean().optional(),
  alwaysUseBuyingPriceForFCYConversion: z.boolean().optional(),
  accountNo: z.string().optional(),
});

export const orgCreateFormSchema = orgFormSchema.extend({
  formOfBusiness: z
    .string()
    .min(1, "Form of business is required")
    .refine((value) => formOfBusinessValues.includes(value), "Select a valid form of business"),
  segment: z
    .string()
    .min(1, "Segment is required")
    .refine((value) => segmentValues.includes(value), "Select a valid segment"),
});

export function validateAccountSelection(selected: string[]): string | null {
  if (selected.length === 0) return "Select at least one account.";
  if (selected.length > MAX_SELECTED_ACCOUNTS) {
    return `Select at most ${MAX_SELECTED_ACCOUNTS} accounts. Register the rest after creation.`;
  }
  return null;
}

export const orgUserUpdateSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(["Admin", "User"]),
  permissionType: z.enum(["INITIATE", "APPROVE", "VIEW"]),
});

export const orgUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(["Admin", "User"]),
  permissionType: z.enum(["INITIATE", "APPROVE", "VIEW"]),
});

export const orgAccountSchema = z.object({
  accountNo: z.string().min(1),
  currency: z.string().min(1),
  accountType: z.string().min(1),
  primary: z.boolean(),
});

export type OrgFormValues = z.infer<typeof orgFormSchema>;
export type OrgCreateFormValues = z.infer<typeof orgCreateFormSchema>;
export type OrgUserFormValues = z.infer<typeof orgUserSchema>;
export type OrgUserUpdateFormValues = z.infer<typeof orgUserUpdateSchema>;
export type OrgAccountFormValues = z.infer<typeof orgAccountSchema>;
