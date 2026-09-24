"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  orgCreateFormSchema,
  orgFormSchema,
  validateAccountSelection,
  type OrgFormValues,
} from "../schemas";
import { useAccountLookup, useCreateOrganization, useUpdateOrganization } from "../hooks";
import type { AccountLookupResponse, OrganizationDetail, OrganizationWritePayload } from "../types";
import { formatOrgApiError } from "../tin";
import {
  FORM_OF_BUSINESS_OPTIONS,
  normalizeFormOfBusiness,
  SEGMENT_OPTIONS,
} from "../constants";
import { useEmployees } from "@/features/employees/hooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { AccountSelectionTable } from "./AccountSelectionTable";

function toCreatePayload(
  values: OrgFormValues,
  accountNumbers: string[],
): OrganizationWritePayload {
  const payload: OrganizationWritePayload = {
    name: values.name,
    formOfBusiness: values.formOfBusiness,
    segment: values.segment,
    accountNumber: values.accountNo,
    accountNumbers,
    tin: values.tin || undefined,
    phone: values.phone || undefined,
    address: values.address || undefined,
    description: values.description || undefined,
    alwaysUseSellingPriceForFCYConvertion: values.alwaysUseSellingPriceForFCYConvertion ?? false,
    alwaysUseBuyingPriceForFCYConversion: values.alwaysUseBuyingPriceForFCYConversion ?? false,
  };
  if (values.assignedCseUserId) {
    payload.assignedCseUserId = values.assignedCseUserId;
  }
  return payload;
}

function toUpdatePayload(
  values: OrgFormValues,
  organization: OrganizationDetail,
): OrganizationWritePayload {
  const payload: OrganizationWritePayload = {
    name: values.name,
    tin: values.tin || undefined,
    phone: values.phone || undefined,
    address: values.address || undefined,
    description: values.description || undefined,
    effectiveDate: values.effectiveDate || undefined,
    expiryDate: values.expiryDate || undefined,
    alwaysUseSellingPriceForFCYConvertion: values.alwaysUseSellingPriceForFCYConvertion ?? false,
    alwaysUseBuyingPriceForFCYConversion: values.alwaysUseBuyingPriceForFCYConversion ?? false,
  };
  if (values.formOfBusiness && values.formOfBusiness !== organization.formOfBusiness) {
    payload.formOfBusiness = values.formOfBusiness;
  }
  if (values.segment && values.segment !== organization.segment) {
    payload.segment = values.segment;
  }
  return payload;
}

function tinStatusMessage(status: string): string {
  if (status === "VALIDATED") return "TIN validated.";
  if (status === "NOT_VALIDATED") return "TIN found but name does not match.";
  return "TIN verification pending — this is normal.";
}

export function OrganizationForm({
  organization,
  embedded = false,
}: {
  organization?: OrganizationDetail;
  embedded?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(organization);
  const create = useCreateOrganization();
  const update = useUpdateOrganization(organization?.id ?? "");
  const lookup = useAccountLookup();
  const [file, setFile] = useState<File | null>(null);
  const [lookupResult, setLookupResult] = useState<AccountLookupResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [selectedAccountNos, setSelectedAccountNos] = useState<Set<string>>(new Set());
  const [accountSelectionError, setAccountSelectionError] = useState<string | null>(null);
  const employees = useEmployees({ page: 0, size: 100 });
  const cseOptions =
    employees.data?.content.filter(
      (employee) => employee.status === "ACTIVE" && employee.roles.includes("BankCSE"),
    ) ?? [];

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(isEdit ? orgFormSchema : orgCreateFormSchema),
    defaultValues: {
      name: organization?.name ?? "",
      formOfBusiness: normalizeFormOfBusiness(organization?.formOfBusiness),
      segment: organization?.segment ?? "",
      tin: organization?.tin ?? "",
      phone: organization?.phone ?? "",
      address: organization?.address ?? "",
      description: organization?.description ?? "",
      effectiveDate: organization?.effectiveDate ?? "",
      expiryDate: organization?.expiryDate ?? "",
      assignedCseUserId: organization?.assignedCseUserId ?? "",
      accountNo: organization?.accounts[0]?.accountNo ?? "",
      alwaysUseSellingPriceForFCYConvertion:
        organization?.alwaysUseSellingPriceForFCYConvertion ?? false,
      alwaysUseBuyingPriceForFCYConversion:
        organization?.alwaysUseBuyingPriceForFCYConversion ?? false,
    },
  });

  const accountFound = lookupResult?.found === true;
  const canCreate = accountFound;

  function onToggleAccount(accountNo: string, checked: boolean) {
    setAccountSelectionError(null);
    setSelectedAccountNos((prev) => {
      const next = new Set(prev);
      if (checked) next.add(accountNo);
      else next.delete(accountNo);
      return next;
    });
  }

  async function onLookup() {
    const accountNumber = form.getValues("accountNo")?.trim();
    if (!accountNumber) {
      setLookupError("Enter an account number to look up.");
      setLookupResult(null);
      setSelectedAccountNos(new Set());
      return;
    }
    setLookupError(null);
    setAccountSelectionError(null);
    try {
      const result = await lookup.mutateAsync(accountNumber);
      setLookupResult(result);
      if (result.found && result.accounts?.length) {
        setSelectedAccountNos(new Set(result.accounts.map((a) => a.accountNo)));
        if (result.customerName) {
          form.setValue("name", result.customerName);
        }
      } else {
        setSelectedAccountNos(new Set());
        setLookupError("Account not found in core banking.");
      }
    } catch (error) {
      setLookupResult(null);
      setSelectedAccountNos(new Set());
      setLookupError(formatOrgApiError(error, "Lookup failed."));
    }
  }

  async function onSubmit(values: OrgFormValues) {
    try {
      if (isEdit && organization) {
        const result = await update.mutateAsync(toUpdatePayload(values, organization));
        toast.success("Organization updated.");
        if (result.warnings?.length) toast.message(result.warnings.join(" · "));
        router.push(`/organizations/${organization.id}`);
      } else {
        const selectionError = validateAccountSelection(Array.from(selectedAccountNos));
        if (selectionError) {
          setAccountSelectionError(selectionError);
          toast.error(selectionError);
          return;
        }
        const result = await create.mutateAsync({
          payload: toCreatePayload(values, Array.from(selectedAccountNos)),
          file,
        });
        toast.success("Organization created.");
        toast.message(tinStatusMessage(result.tinValidationStatus));
        if (result.warnings?.length) toast.message(result.warnings.join(" · "));
        router.push(`/organizations/${result.id}`);
      }
    } catch (error) {
      toast.error(formatOrgApiError(error, "Save failed."));
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-1 md:px-2">
      {!embedded && (
        <PageHeader
          title={isEdit ? "Edit organization" : "Register organization"}
          description="Registration never blocks on TIN lookup. Name, TIN, and phone must be unique."
        />
      )}
      {embedded && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Edit contract{organization ? `: ${organization.name}` : ""}
          </h2>
        </div>
      )}
      <Card className={cn(embedded ? "border-0 shadow-none" : "w-full max-w-3xl mx-auto")}>
        {!embedded && (
          <CardHeader>
            <CardTitle>{isEdit ? "Company details" : "Register organization"}</CardTitle>
          </CardHeader>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {!isEdit && (
                <>
                  <FormField
                    control={form.control}
                    name="accountNo"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Account number</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="13-digit account number"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setLookupResult(null);
                                setSelectedAccountNos(new Set());
                                setLookupError(null);
                                setAccountSelectionError(null);
                              }}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={lookup.isPending}
                            onClick={() => void onLookup()}
                          >
                            Look up
                          </Button>
                        </div>
                        {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {lookupResult?.found && lookupResult.accounts?.length && (
                    <div className="sm:col-span-2 space-y-2">
                      <p className="text-sm font-medium">
                        Customer: {lookupResult.customerName ?? lookupResult.customerId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Accounts we found for this customer — tick which ones this company will use:
                      </p>
                      {lookupResult.listingComplete === false && (
                        <Alert>
                          <AlertDescription>
                            We could not list all accounts for this customer. The list below may be
                            incomplete.
                          </AlertDescription>
                        </Alert>
                      )}
                      <AccountSelectionTable
                        accounts={lookupResult.accounts}
                        selectedAccountNos={selectedAccountNos}
                        onToggle={onToggleAccount}
                      />
                      {accountSelectionError && (
                        <p className="text-sm text-destructive">{accountSelectionError}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="formOfBusiness"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Form of business</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a form of business" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FORM_OF_BUSINESS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="segment"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Segment</FormLabel>
                    {isEdit && !organization?.segment && (
                      <Alert className="mb-2">
                        <AlertDescription>
                          Segment not set — please choose one for this organization.
                        </AlertDescription>
                      </Alert>
                    )}
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a segment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SEGMENT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TIN</FormLabel>
                    <FormControl>
                      <Input placeholder="10 digits" {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isEdit && (
                <>
                  <FormField
                    control={form.control}
                    name="effectiveDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="text-sm font-medium">FCY conversion price basis</legend>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="fcy-price-basis"
                      value="selling"
                      checked={form.watch("alwaysUseSellingPriceForFCYConvertion") === true}
                      onChange={() => {
                        form.setValue("alwaysUseSellingPriceForFCYConvertion", true);
                        form.setValue("alwaysUseBuyingPriceForFCYConversion", false);
                      }}
                      className="size-4 accent-primary"
                    />
                    Always use selling price
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="fcy-price-basis"
                      value="buying"
                      checked={form.watch("alwaysUseBuyingPriceForFCYConversion") === true}
                      onChange={() => {
                        form.setValue("alwaysUseSellingPriceForFCYConvertion", false);
                        form.setValue("alwaysUseBuyingPriceForFCYConversion", true);
                      }}
                      className="size-4 accent-primary"
                    />
                    Always use buying price
                  </label>
                </div>
              </fieldset>
              {!isEdit && (
                <>
                  <FormField
                    control={form.control}
                    name="assignedCseUserId"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Assigned CSE (optional)</FormLabel>
                        <Select
                          value={field.value || undefined}
                          onValueChange={(value) => field.onChange(value ?? "")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a BankCSE employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cseOptions.map((employee) => {
                              const label = [
                                [employee.firstName, employee.lastName].filter(Boolean).join(" ") ||
                                  employee.username,
                                employee.email,
                              ]
                                .filter(Boolean)
                                .join(" ");
                              return (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="license">Business license (optional)</Label>
                    <Input
                      id="license"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || update.isPending || (!isEdit && !canCreate)}
              >
                {isEdit ? "Save changes" : "Create"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
