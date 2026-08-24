"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { profileSchema, type ProfileFormValues } from "../schemas";
import { useSession } from "../hooks/useSession";
import { useUpdateProfile } from "../hooks/useOfficers";
import { ROLE_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function ProfileForm() {
  const { user } = useSession();
  const updateMutation = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      department: user?.department ?? "",
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    try {
      await updateMutation.mutateAsync(values);
      toast.success("Profile saved.");
    } catch {
      toast.error("Failed to save profile.");
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Contact details shown on your officer record in this portal."
      />

      <Card className="max-w-2xl">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription className="mt-1">
                Role is assigned by an administrator and cannot be changed here.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-medium">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} autoComplete="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+63 917 000 0000" {...field} autoComplete="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Corporate Onboarding" {...field} />
                    </FormControl>
                    <FormDescription>Shown beside your name in the directory.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                Save profile
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
