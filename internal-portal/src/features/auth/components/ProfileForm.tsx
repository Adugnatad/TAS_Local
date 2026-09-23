"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { changePasswordSchema, type ChangePasswordFormValues } from "../schemas";
import { useSession } from "../hooks/useSession";
import { changePassword } from "../api";
import { displayName } from "../types";
import { ApiError } from "@/lib/api-client";
import { PERMISSION_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export function ProfileForm() {
  const { user } = useSession();
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      form.reset();
      toast.success("Password updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to change password.");
    }
  }

  if (!user) return null;

  const name = displayName(user);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-1 md:px-2">
      <PageHeader title="Profile" description="Your employee account details and password." />

      <div className="w-full space-y-6">
        <Card className="gap-0 py-0 shadow-sm">
          <CardHeader className="border-b bg-sky-50/60 py-5">
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
                aria-hidden
              >
                {initials(name)}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <CardTitle className="text-xl">{name}</CardTitle>
                  <CardDescription className="mt-1">
                    @{user.username}
                    {user.email ? ` · ${user.email}` : ""}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                  <Badge variant="outline">{user.userType}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 py-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Username
                </dt>
                <dd className="mt-1 text-sm font-medium">{user.username}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 text-sm font-medium">{user.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Account type
                </dt>
                <dd className="mt-1 text-sm font-medium">{user.userType}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Roles
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {user.roles.length ? user.roles.join(", ") : "—"}
                </dd>
              </div>
            </dl>

            <Separator />

            <div>
              <h3 className="mb-2.5 text-sm font-semibold tracking-wide text-sky-800">
                Permissions
              </h3>
              {user.permissions.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.permissions.map((code) => (
                    <Badge key={code} variant="outline" className="font-normal">
                      {PERMISSION_LABELS[code] ?? code}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No permissions assigned.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0 shadow-sm">
          <CardHeader className="border-b py-5">
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Enter your current password, then choose a new one (at least 8 characters).
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="grid gap-4 py-5">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Update password
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
