import { z } from "zod";

export const signatorySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  role: z.string().min(2, "Role is required"),
  signatureLimit: z.coerce.number().min(0, "Signature limit must be 0 or greater"),
  isActive: z.boolean(),
});

export const signatoryRuleSchema = z
  .object({
    minSignatories: z.coerce.number().min(1, "At least 1 signatory required"),
    maxSignatories: z.union([z.coerce.number().min(1), z.literal("")]).optional(),
    requiredRoles: z.array(z.string()).optional(),
    roleMatch: z.enum(["all", "any"]),
    dualControl: z.boolean(),
    amountThreshold: z.coerce.number().min(0, "Amount threshold must be 0 or greater"),
  })
  .superRefine((value, ctx) => {
    const max =
      value.maxSignatories === "" || value.maxSignatories === undefined
        ? undefined
        : Number(value.maxSignatories);
    if (max !== undefined && max < value.minSignatories) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Max signatories cannot be less than minimum",
        path: ["maxSignatories"],
      });
    }
  });

export const matrixPreviewSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
});

export const signatoryTitleSchema = z.object({
  name: z.string().min(2, "Title is required"),
  isActive: z.boolean(),
});

export type SignatoryFormValues = z.infer<typeof signatorySchema>;
export type SignatoryRuleFormValues = z.infer<typeof signatoryRuleSchema>;
export type MatrixPreviewFormValues = z.infer<typeof matrixPreviewSchema>;
export type SignatoryTitleFormValues = z.infer<typeof signatoryTitleSchema>;
