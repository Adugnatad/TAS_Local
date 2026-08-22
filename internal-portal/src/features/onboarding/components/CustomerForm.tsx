"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { CustomerProfile } from "../types";
import { customerProfileSchema, type CustomerProfileFormValues } from "../schemas";
import { useCreateCustomer, useUpdateCustomer } from "../hooks/useCustomers";
import { useSession } from "@/features/auth/hooks/useSession";
import { RoleGate } from "@/components/layout/RBACGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ONBOARDING_STATUS_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface CustomerFormProps {
  customer?: CustomerProfile;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const { hasRole } = useSession();
  const isEdit = !!customer;
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(customer?.id ?? "");

  const form = useForm<CustomerProfileFormValues>({
    resolver: zodResolver(customerProfileSchema),
    defaultValues: {
      legalName: customer?.legalName ?? "",
      registrationNumber: customer?.registrationNumber ?? "",
      industry: customer?.industry ?? "",
    },
  });

  const canEdit = !isEdit || customer.onboardingStatus === "draft" || hasRole("supervisor", "admin");
  const canSubmitForReview = isEdit && customer.onboardingStatus === "draft" && hasRole("officer", "supervisor", "admin");
  const canApprove = isEdit && customer.onboardingStatus === "pending_review" && hasRole("supervisor", "admin");
  const canReject = canApprove;

  async function onSubmit(values: CustomerProfileFormValues) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(values);
        toast.success("Customer profile updated.");
      } else {
        const created = await createMutation.mutateAsync(values);
        toast.success("Customer profile created.");
        router.push(`/onboarding/${created.id}`);
      }
    } catch {
      toast.error("Failed to save customer profile.");
    }
  }

  async function updateStatus(status: CustomerProfile["onboardingStatus"]) {
    if (!customer) return;
    try {
      await updateMutation.mutateAsync({ onboardingStatus: status });
      toast.success(`Status updated to ${ONBOARDING_STATUS_LABELS[status]}.`);
    } catch {
      toast.error("Failed to update status.");
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {isEdit && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Current status:</span>
          <StatusBadge
            status={customer.onboardingStatus}
            label={ONBOARDING_STATUS_LABELS[customer.onboardingStatus]}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Customer Profile" : "New Customer Profile"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Legal Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit || isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit || isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit || isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {canEdit && (
                <Button type="submit" disabled={isPending}>
                  {isEdit ? "Save Changes" : "Create Customer"}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {isEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Status Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {canSubmitForReview && (
              <Button
                variant="secondary"
                disabled={isPending}
                onClick={() => updateStatus("pending_review")}
              >
                Submit for Review
              </Button>
            )}
            <RoleGate allowedRoles={["supervisor", "admin"]}>
              {canApprove && (
                <Button disabled={isPending} onClick={() => updateStatus("approved")}>
                  Approve Onboarding
                </Button>
              )}
              {canReject && (
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => updateStatus("rejected")}
                >
                  Reject
                </Button>
              )}
            </RoleGate>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
