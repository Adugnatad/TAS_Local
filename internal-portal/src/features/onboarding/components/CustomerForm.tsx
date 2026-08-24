"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { CustomerProfile } from "../types";
import { customerProfileSchema, type CustomerProfileFormValues } from "../schemas";
import { useCreateCustomer, useUpdateCustomer } from "../hooks/useCustomers";
import { useSession } from "@/features/auth/hooks/useSession";
import { useCan } from "@/features/settings/hooks/useCan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ONBOARDING_STATUS_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface CustomerFormProps {
  customer?: CustomerProfile;
}

function workflowHint(status: CustomerProfile["onboardingStatus"], canAct: boolean) {
  if (canAct) return null;
  switch (status) {
    case "draft":
      return "Only assigned officers can submit this profile for review.";
    case "pending_review":
      return "Waiting on a supervisor or administrator to approve or reject.";
    case "approved":
      return "Onboarding is complete. Profile details can still be corrected by a supervisor.";
    case "rejected":
      return "This profile was rejected. A supervisor can reopen edits if needed.";
    default:
      return "No workflow actions are available for your role at this status.";
  }
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const { hasRole } = useSession();
  const canApproveOnboarding = useCan("onboarding.approve");
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
  const canSubmitForReview =
    isEdit && customer.onboardingStatus === "draft" && hasRole("officer", "supervisor", "admin");
  const canApprove = isEdit && customer.onboardingStatus === "pending_review" && canApproveOnboarding;
  const canReject = canApprove;
  const hasWorkflowActions = canSubmitForReview || canApprove;

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
    <div className="max-w-2xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isEdit ? customer.legalName : "New customer"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit
              ? "Legal identity used for onboarding, signatory matrix, and CRM requests."
              : "Capture the corporate legal name and registration details to start onboarding."}
          </p>
        </div>
        {isEdit && (
          <StatusBadge
            status={customer.onboardingStatus}
            label={ONBOARDING_STATUS_LABELS[customer.onboardingStatus]}
          />
        )}
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Customer profile</CardTitle>
          <CardDescription>
            {canEdit
              ? "Fields feed search, signatory setup, and request matching."
              : "Read-only while the file is under review."}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Legal name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit || isPending} autoComplete="organization" />
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
                    <FormLabel>Registration number</FormLabel>
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
                      <Input
                        placeholder="e.g. Manufacturing"
                        {...field}
                        disabled={!canEdit || isPending}
                      />
                    </FormControl>
                    <FormDescription>Used in customer search and reporting.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            {canEdit && (
              <CardFooter className="justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => router.push("/onboarding")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isEdit ? "Save changes" : "Create customer"}
                </Button>
              </CardFooter>
            )}
          </form>
        </Form>
      </Card>

      {isEdit && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Onboarding workflow</CardTitle>
            <CardDescription>
              Move the file from draft through review. Actions depend on status and your role.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {hasWorkflowActions ? (
              <div className="flex flex-wrap gap-2">
                {canSubmitForReview && (
                  <Button
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => updateStatus("pending_review")}
                  >
                    Submit for Review
                  </Button>
                )}
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
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {workflowHint(customer.onboardingStatus, false)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
