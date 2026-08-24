"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { OFFICER_ROLES, ROLE_LABELS } from "@/lib/constants";
import { useSession } from "@/features/auth/hooks/useSession";
import { login } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const loginSchema = z.object({
  role: z.enum(OFFICER_ROLES),
  name: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setSession } = useSession();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: "officer" },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/status");
    }
  }, [isAuthenticated, router]);

  async function onSubmit(values: LoginFormValues) {
    try {
      const user = await login(values);
      setSession(user);
      toast.success(`Signed in as ${ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}`);
      router.push("/status");
    } catch {
      toast.error("Login failed. Please try again.");
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between p-10">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary via-primary to-sidebar"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <BrandLogo
            priority
            className="p-3"
            imageClassName="h-16 w-auto max-w-[280px]"
          />
          <p className="mt-3 text-sm font-medium text-white/85">TAS Corporate Portal</p>
        </div>
        <div className="relative z-10 max-w-md space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">Internal officer access</h1>
          <p className="text-base leading-relaxed text-white/85">
            Onboard corporate customers, configure signatory matrices, and follow CRM requests
            across CoopStream and TSS.
          </p>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Restricted to bank officers, supervisors, and administrators
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/60">Secure internal use only</p>
      </aside>

      <div className="flex items-center justify-center bg-muted p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo
              priority
              className="mb-4 p-2.5"
              imageClassName="h-14 w-auto max-w-[220px]"
            />
            <h1 className="text-2xl font-semibold tracking-tight">TAS Corporate Portal</h1>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-border/80 sm:p-8">
            <div className="mb-6 hidden border-b border-border/70 pb-5 lg:block">
              <BrandLogo className="mb-5 p-2.5" imageClassName="h-12 w-auto max-w-[200px]" />
              <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Internal Web — bank officer authentication
              </p>
            </div>
            <div className="mb-6 border-b border-border/70 pb-4 lg:hidden">
              <h2 className="text-lg font-semibold">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">Bank officer authentication</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger aria-label="Select role">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OFFICER_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Determines what you can view and change in this mock session.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional override" {...field} />
                      </FormControl>
                      <FormDescription>Leave blank to use the seeded officer name.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" size="lg">
                  Sign In
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Mock authentication — select a role to simulate RBAC permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
