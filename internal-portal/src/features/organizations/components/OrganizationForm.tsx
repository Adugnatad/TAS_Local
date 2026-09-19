"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { orgFormSchema, type OrgFormValues } from "../schemas";
import { useAccountLookup, useCreateOrganization, useUpdateOrganization } from "../hooks";
import type { AccountLookupResponse, OrganizationDetail, OrganizationWritePayload } from "../types";
import { formatOrgApiError } from "../tin";
import { useEmployees } from "@/features/employees/hooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function toCreatePayload(values: OrgFormValues, customerId: string): OrganizationWritePayload {
  const payload: OrganizationWritePayload = {
    name: values.name,
    formOfBusiness: values.formOfBusiness || undefined,
    accountNumber: values.accountNo,
    customerId,
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

function toUpdatePayload(values: OrgFormValues): OrganizationWritePayload {
  return {
    name: values.name,
    formOfBusiness: values.formOfBusiness || undefined,
    tin: values.tin || undefined,
    phone: values.phone || undefined,
    address: values.address || undefined,
    description: values.description || undefined,
    effectiveDate: values.effectiveDate || undefined,
    expiryDate: values.expiryDate || undefined,
    alwaysUseSellingPriceForFCYConvertion: values.alwaysUseSellingPriceForFCYConvertion ?? false,
    alwaysUseBuyingPriceForFCYConversion: values.alwaysUseBuyingPriceForFCYConversion ?? false,
  };
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
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<AccountLookupResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const employees = useEmployees({ page: 0, size: 100 });
  const cseOptions =
    employees.data?.content.filter(
      (employee) => employee.status === "ACTIVE" && employee.roles.includes("BankCSE"),
    ) ?? [];

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgFormSchema),
    defaultValues: {
      name: organization?.name ?? "",
      formOfBusiness: organization?.formOfBusiness ?? "",
      tin: organization?.tin ?? "",
      phone: organization?.phone ?? "",
      address: organization?.address ?? "",
      description: organization?.description ?? "",
      effectiveDate: organization?.effectiveDate ?? "",
      expiryDate: organization?.expiryDate ?? "",
      assignedCseUserId: organization?.assignedCseUserId ?? "",
      accountNo: organization?.accounts[0]?.accountNo ?? "",
      currency: organization?.accounts[0]?.currency ?? "ETB",
      accountType: organization?.accounts[0]?.accountType ?? "CURRENT",
      primary: organization?.accounts[0]?.primary ?? true,
      alwaysUseSellingPriceForFCYConvertion:
        organization?.alwaysUseSellingPriceForFCYConvertion ?? false,
      alwaysUseBuyingPriceForFCYConversion:
        organization?.alwaysUseBuyingPriceForFCYConversion ?? false,
    },
  });

  const accountFound = lookupResult?.found === true && Boolean(customerId);
  const canCreate = accountFound;

  async function onLookup() {
    const accountNumber = form.getValues("accountNo")?.trim();
    if (!accountNumber) {
      setLookupError("Enter an account number to look up.");
      setLookupResult(null);
      setCustomerId(null);
      return;
    }
    setLookupError(null);
    try {
      const result = await lookup.mutateAsync(accountNumber);
      setLookupResult(result);
      if (result.found && result.customerId) {
        setCustomerId(result.customerId);
        if (result.customerName) {
          form.setValue("name", result.customerName);
        }
      } else {
        setCustomerId(null);
        setLookupError("Account not found.");
      }
    } catch (error) {
      setLookupResult(null);
      setCustomerId(null);
      setLookupError(formatOrgApiError(error, "Lookup failed."));
    }
  }

  async function onSubmit(values: OrgFormValues) {
    try {
      if (isEdit && organization) {
        const result = await update.mutateAsync(toUpdatePayload(values));
        toast.success("Organization updated.");
        if (result.warnings?.length) toast.message(result.warnings.join(" · "));
        router.push(`/organizations/${organization.id}`);
      } else {
        if (!values.formOfBusiness) {
          toast.error("Form of business is required.");
          return;
        }
        if (!customerId) {
          toast.error("Look up and confirm the account before creating.");
          return;
        }
        const result = await create.mutateAsync({
          payload: toCreatePayload(values, customerId),
          file,
        });
        toast.success("Organization created.");
        if (result.warnings?.length) toast.message(result.warnings.join(" · "));
        router.push(`/organizations/${result.id}`);
      }
    } catch (error) {
      toast.error(formatOrgApiError(error, "Save failed."));
    }
  }

  return (
    <div className="space-y-6">
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
      <Card className={cn(embedded ? "border-0 shadow-none" : "max-w-3xl")}>
        {!embedded && (
          <CardHeader>
            <CardTitle>Company details</CardTitle>
          </CardHeader>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4 sm:grid-cols-2">
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
                        <SelectItem value="Cooperatives">Cooperatives</SelectItem>
                        <SelectItem value="Individual/Sole">Individual/Sole</SelectItem>
                        <SelectItem value="Partnerships/plc">Partnerships/plc</SelectItem>
                        <SelectItem value="Cooperations/Share companies">
                          Cooperations/Share companies
                        </SelectItem>
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
                                setCustomerId(null);
                                setLookupError(null);
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
                        The following accounts will be auto-registered from core banking:
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lookupResult.accounts.map((account) => (
                            <TableRow key={account.accountNo}>
                              <TableCell>{account.accountNo}</TableCell>
                              <TableCell>{account.currency}</TableCell>
                              <TableCell>{account.accountType}</TableCell>
                              <TableCell>{account.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
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
