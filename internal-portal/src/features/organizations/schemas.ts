import { z } from "zod";

export const orgFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tin: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  crmSystemId: z.string().optional(),
  description: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  accountNo: z.string().optional(),
  currency: z.string().optional(),
  accountType: z.string().optional(),
  primary: z.boolean().optional(),
});

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
export type OrgUserFormValues = z.infer<typeof orgUserSchema>;
export type OrgUserUpdateFormValues = z.infer<typeof orgUserUpdateSchema>;
export type OrgAccountFormValues = z.infer<typeof orgAccountSchema>;
