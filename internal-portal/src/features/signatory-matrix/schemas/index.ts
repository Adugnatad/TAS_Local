import { z } from "zod";

export const signatorySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  role: z.string().min(2, "Role is required"),
  signatureLimit: z.coerce.number().min(0, "Signature limit must be 0 or greater"),
  isActive: z.boolean(),
});

export const signatoryRuleSchema = z.object({
  minSignatories: z.coerce.number().min(1, "At least 1 signatory required"),
  requiredRoles: z.array(z.string()).optional(),
  amountThreshold: z.coerce.number().min(0, "Amount threshold must be 0 or greater"),
});

export const matrixPreviewSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
});

export type SignatoryFormValues = z.infer<typeof signatorySchema>;
export type SignatoryRuleFormValues = z.infer<typeof signatoryRuleSchema>;
export type MatrixPreviewFormValues = z.infer<typeof matrixPreviewSchema>;
