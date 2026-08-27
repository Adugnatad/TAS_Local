"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { orgFormSchema, type OrgFormValues } from "../schemas";
import { useCreateOrganization, useUpdateOrganization } from "../hooks";
import type { OrganizationDetail, OrganizationWritePayload } from "../types";
import { formatOrgApiError } from "../tin";
import { useEmployees } from "@/features/employees/hooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function toPayload(values: OrgFormValues, includeAccount: boolean): OrganizationWritePayload {
  const payload: OrganizationWritePayload = {
    name: values.name,
    tin: values.tin || undefined,
    phone: values.phone || undefined,
    address: values.address || undefined,
    crmSystemId: values.crmSystemId || undefined,
    description: values.description || undefined,
    effectiveDate: values.effectiveDate || undefined,
    expiryDate: values.expiryDate || undefined,
  };
  if (values.assignedCseUserId) {
    payload.assignedCseUserId = values.assignedCseUserId;
  }
  if (includeAccount && values.accountNo) {
    payload.accounts = [
      {
        accountNo: values.accountNo,
        currency: values.currency || "ETB",
        accountType: values.accountType || "CURRENT",
        primary: values.primary ?? true,
      },
    ];
  }
  return payload;
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
  const [file, setFile] = useState<File | null>(null);
  const employees = useEmployees({ page: 0, size: 100 });
  const cseOptions =
    employees.data?.content.filter(
      (employee) =>
        employee.status === "ACTIVE" && employee.roles.includes("BankCSE"),
    ) ?? [];

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgFormSchema),
    defaultValues: {
      name: organization?.name ?? "",
      tin: organization?.tin ?? "",
      phone: organization?.phone ?? "",
      address: organization?.address ?? "",
      crmSystemId: organization?.crmSystemId ?? "",
      description: organization?.description ?? "",
      effectiveDate: organization?.effectiveDate ?? "",
      expiryDate: organization?.expiryDate ?? "",
      assignedCseUserId: organization?.assignedCseUserId ?? "",
      accountNo: organization?.accounts[0]?.accountNo ?? "",
      currency: organization?.accounts[0]?.currency ?? "ETB",
      accountType: organization?.accounts[0]?.accountType ?? "CURRENT",
      primary: organization?.accounts[0]?.primary ?? true,
    },
  });

  async function onSubmit(values: OrgFormValues) {
    try {
      if (isEdit && organization) {
        const result = await update.mutateAsync(toPayload(values, false));
        toast.success("Organization updated.");
        if (result.warnings?.length) toast.message(result.warnings.join(" · "));
        router.push(`/organizations/${organization.id}`);
      } else {
        const result = await create.mutateAsync({ payload: toPayload(values, true), file });
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
                name="crmSystemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CRM system ID</FormLabel>
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
                                [employee.firstName, employee.lastName]
                                  .filter(Boolean)
                                  .join(" ") || employee.username,
                                employee.crmSystemId ? `(${employee.crmSystemId})` : null,
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
                  <FormField
                    control={form.control}
                    name="accountNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account type</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="primary"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0 pt-8">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        </FormControl>
                        <FormLabel>Primary account</FormLabel>
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
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {isEdit ? "Save changes" : "Create"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
