"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useSession } from "@/features/auth/hooks/useSession";
import { getMe, login } from "@/features/auth/api";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { displayName } from "@/features/auth/types";
import { ApiError } from "@/lib/api-client";
import { clearTokens, setTokens } from "@/lib/token-store";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setSession } = useSession();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/organizations");
    }
  }, [isAuthenticated, router]);

  async function onSubmit(values: LoginFormValues) {
    try {
      const tokens = await login(values);
      setTokens(tokens.accessToken, tokens.refreshToken);
      const me = await getMe();
      if (me.userType !== "EMPLOYEE") {
        clearTokens();
        toast.error("This portal is for bank employees only.");
        return;
      }
      setSession(me, tokens.accessToken, tokens.refreshToken);
      toast.success(`Signed in as ${displayName(me)}`);
      router.push("/organizations");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Login failed. Please try again.";
      toast.error(message);
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
          <h1 className="text-3xl font-semibold tracking-tight">Internal bank access</h1>
          <p className="text-base leading-relaxed text-white/85">
            Onboard organizations, manage employees and roles, configure signatory matrices, and
            oversee loan requests.
          </p>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Restricted to BankAdmin, BankCSE, and BankEngineer
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
                Internal portal — employee authentication
              </p>
            </div>
            <div className="mb-6 border-b border-border/70 pb-4 lg:hidden">
              <h2 className="text-lg font-semibold">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">Employee authentication</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input autoComplete="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
                  Sign In
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
