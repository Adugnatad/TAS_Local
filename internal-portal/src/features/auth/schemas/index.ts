import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  department: z.string().optional(),
});

export const officerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["officer", "supervisor", "admin"]),
  phone: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type OfficerFormValues = z.infer<typeof officerSchema>;
