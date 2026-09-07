import { z } from "zod";

export const employeeFormSchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(8),
    email: z.string().email().optional().or(z.literal("")),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    crmSystemId: z.string().optional(),
    engineerSystemId: z.string().optional(),
    roleNames: z.array(z.string()).min(1, "Select at least one role"),
  })
  .superRefine((values, ctx) => {
    if (
      (values.roleNames.includes("BankCSE") || values.roleNames.includes("BankEngineer")) &&
      !values.email?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required for BankCSE or BankEngineer",
        path: ["email"],
      });
    }
  });

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;