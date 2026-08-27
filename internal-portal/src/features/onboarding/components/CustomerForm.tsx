"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { CustomerProfile as OrganizationProfile, ValidationResult } from "../../../lib/types";
import {
  customerProfileSchema as organizationProfileSchema,
  type CustomerProfileFormValues as OrganizationProfileFormValues,
} from "../schemas";
import { apiClient } from "@/lib/api-client";
import { CreateCustomer, useUpdateCustomer as useUpdateOrganization } from "../hooks/useCustomers";
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

interface OrganizationFormProps {
  organization?: OrganizationProfile;
}

function workflowHint(status: OrganizationProfile["onboardingStatus"], canAct: boolean) {
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

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const router = useRouter();
  const [tinWarning, setTinWarning] = useState("");
  const [licenseWarning, setLicenseWarning] = useState("");
  const [tinValidation, setTinValidation] = useState<"idle" | "valid" | "invalid">("idle");
  const [licenseValidation, setLicenseValidation] = useState<"idle" | "valid" | "invalid">("idle");
  const [isValidatingTin, setIsValidatingTin] = useState(false);
  const [isValidatingLicense, setIsValidatingLicense] = useState(false);
  const { hasRole } = useSession();
  const canApproveOnboarding = useCan("onboarding.approve");
  const isEdit = !!organization;
  const updateMutation = useUpdateOrganization(organization?.id ?? "");
  const [isPending, setIsPending] = useState(false);

  const form = useForm<OrganizationProfileFormValues>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      name: organization?.name ?? "",
      address: organization?.address ?? "",
      phone: organization?.phone ?? "",
      tin: organization?.tin ?? "",
      crmSystemId: organization?.crmSystemId ?? "",
      businessLicense: organization?.businessLicense,
      accounts: organization?.accounts ?? [{ accountNumber: "", isPrimary: true }],
    },
  });
  const accountFields = useFieldArray({ control: form.control, name: "accounts" });

  const canEdit =
    !isEdit || organization.onboardingStatus === "draft" || hasRole("supervisor", "admin");
  const canSubmitForReview =
    isEdit &&
    organization.onboardingStatus === "draft" &&
    hasRole("officer", "supervisor", "admin");
  const canApprove =
    isEdit && organization.onboardingStatus === "pending_review" && canApproveOnboarding;
  const canReject = canApprove;
  const hasWorkflowActions = canSubmitForReview || canApprove;

  async function onSubmit(values: OrganizationProfileFormValues) {
    setIsPending(true);
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(values);
        toast.success("Organization profile updated.");
      } else {
        const created = await CreateCustomer(values);
        if (created) setIsPending(false);
        toast.success("Organization profile created.");
        router.push(`/onboarding/${created.id}`);
      }
    } catch {
      setIsPending(false);
      toast.error("Failed to save organization profile.");
    }
  }

  async function updateStatus(status: OrganizationProfile["onboardingStatus"]) {
    if (!organization) return;
    try {
      await updateMutation.mutateAsync({ onboardingStatus: status });
      toast.success(`Status updated to ${ONBOARDING_STATUS_LABELS[status]}.`);
    } catch {
      toast.error("Failed to update status.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-5">
      {/* <div className="flex flex-wrap items-start self-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isEdit ? organization.name : "New organization"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit
              ? "Organization identity used for onboarding, signatory matrix, and CRM requests."
              : "Capture the organization details to start onboarding."}
          </p>
        </div>
        {isEdit && (
          <StatusBadge
            status={organization.onboardingStatus}
            label={ONBOARDING_STATUS_LABELS[organization.onboardingStatus]}
          />
        )}
      </div> */}

      <Card className="w-[80%] p-10">
        <CardHeader className="border-b">
          <CardTitle>Organization profile</CardTitle>
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
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!canEdit || isPending}
                        autoComplete="organization"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit || isPending} />
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
                      <Input
                        placeholder="e.g. +63 917 555 0100"
                        {...field}
                        disabled={!canEdit || isPending}
                      />
                    </FormControl>
                    <FormDescription>Used for organization contact.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      TIN <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        maxLength={10}
                        disabled={!canEdit || isPending}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(value);
                          setTinValidation("idle");
                          setTinWarning(value && !/^\d+$/.test(value) ? "Use digits only." : "");
                        }}
                      />
                    </FormControl>
                    {/^\d{10}$/.test(field.value ?? "") && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-fit"
                        disabled={!canEdit || isPending || isValidatingTin}
                        onClick={async () => {
                          setIsValidatingTin(true);
                          try {
                            const result = await apiClient<ValidationResult>(
                              "/customers/validate-tin",
                              {
                                method: "POST",
                                body: { tin: field.value },
                              },
                            );
                            setTinValidation(result.valid ? "valid" : "invalid");
                            setTinWarning(
                              result.valid ? "" : (result.message ?? "TIN could not be validated."),
                            );
                          } catch (error) {
                            setTinValidation("invalid");
                            setTinWarning(
                              error instanceof Error ? error.message : "TIN validation failed.",
                            );
                          } finally {
                            setIsValidatingTin(false);
                          }
                        }}
                      >
                        {isValidatingTin ? "Validating..." : "Validate TIN"}
                      </Button>
                    )}
                    {tinValidation === "valid" && (
                      <FormDescription className="text-green-700">TIN is valid.</FormDescription>
                    )}
                    {tinWarning && (
                      <FormDescription className="text-amber-700">{tinWarning}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="crmSystemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      CRM system ID{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit || isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessLicense"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      Business license{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!canEdit || isPending}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            field.onChange(undefined);
                            setLicenseWarning("");
                            return;
                          }
                          field.onChange({ name: file.name, size: file.size, type: file.type });
                          setLicenseValidation("idle");
                          setLicenseWarning("");
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-fit"
                      disabled={!canEdit || isPending || isValidatingLicense || !field.value}
                      onClick={async () => {
                        if (!field.value) return;
                        setIsValidatingLicense(true);
                        try {
                          const result = await apiClient<ValidationResult>(
                            "/customers/validate-business-license",
                            { method: "POST", body: { businessLicense: field.value } },
                          );
                          setLicenseValidation(result.valid ? "valid" : "invalid");
                          setLicenseWarning(
                            result.valid
                              ? ""
                              : (result.message ?? "Business license could not be validated."),
                          );
                        } catch (error) {
                          setLicenseValidation("invalid");
                          setLicenseWarning(
                            error instanceof Error
                              ? error.message
                              : "Business license validation failed.",
                          );
                        } finally {
                          setIsValidatingLicense(false);
                        }
                      }}
                    >
                      {isValidatingLicense ? "Validating..." : "Validate business license"}
                    </Button>
                    {licenseValidation === "valid" && (
                      <FormDescription className="text-green-700">
                        Business license file is valid.
                      </FormDescription>
                    )}
                    {licenseValidation === "invalid" && (
                      <FormDescription className="text-amber-700">
                        Use a PDF, JPG, or PNG file up to 10 MB. You can continue.
                      </FormDescription>
                    )}
                    {field.value && <FormDescription>{field.value.name}</FormDescription>}
                    {licenseWarning && (
                      <FormDescription className="text-amber-700">
                        {licenseWarning} You can continue.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3 sm:col-span-2">
                <div>
                  <FormLabel>Accounts</FormLabel>
                  <FormDescription>
                    Add one or more accounts and mark exactly one as primary.
                  </FormDescription>
                </div>
                {accountFields.fields.map((account, index) => (
                  <div key={account.id} className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name={`accounts.${index}.accountNumber`}
                      render={({ field }) => (
                        <FormItem className="min-w-0 flex-1">
                          <FormLabel className="sr-only">Account {index + 1}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Account number"
                              disabled={!canEdit || isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant={form.watch(`accounts.${index}.isPrimary`) ? "secondary" : "outline"}
                      disabled={!canEdit || isPending}
                      onClick={() =>
                        form.setValue(
                          "accounts",
                          form.getValues("accounts").map((item, itemIndex) => ({
                            ...item,
                            isPrimary: itemIndex === index,
                          })),
                        )
                      }
                    >
                      Primary
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={!canEdit || isPending || accountFields.fields.length === 1}
                      onClick={() => accountFields.remove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canEdit || isPending}
                  onClick={() => accountFields.append({ accountNumber: "", isPrimary: false })}
                >
                  Add account
                </Button>
                {form.formState.errors.accounts?.root?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.accounts.root.message}
                  </p>
                )}
              </div>
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
                  {isEdit ? "Save changes" : "Create organization"}
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
                {workflowHint(organization.onboardingStatus, false)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
