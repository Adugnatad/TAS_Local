"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, parseISO, isValid } from "date-fns";
import { useCatalogs, useLoanMutations, useLoanRequest, useLoanRequests } from "../hooks";
import { useSession } from "@/features/auth/hooks/useSession";
import { ApiError } from "@/lib/api-client";
import { formatOrgApiError } from "@/features/organizations/tin";
import { cn } from "@/lib/utils";
import type { PageResponse } from "@/types/global";
import type { CatalogOption, LoanRequest } from "../types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function asList(data: PageResponse<LoanRequest> | LoanRequest[] | undefined): LoanRequest[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.content;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    const date = value.includes("T") ? parseISO(value) : new Date(value);
    return isValid(date) ? format(date, "MMM d, yyyy HH:mm") : value;
  } catch {
    return value;
  }
}

function formatAmount(amount?: number, currency?: string) {
  if (amount == null || Number.isNaN(amount)) return "—";
  const formatted = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(amount);
  return currency ? `${formatted} ${currency}` : formatted;
}

function catalogOptions(raw: unknown): CatalogOption[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as CatalogOption[];
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["content", "items", "data", "products", "businessTypes"]) {
      if (Array.isArray(obj[key])) return obj[key] as CatalogOption[];
    }
  }
  return [];
}

function optionLabel(item: CatalogOption) {
  return item.name || item.label || item.code || item.value || item.id || "Option";
}

function optionValue(item: CatalogOption) {
  return item.code || item.value || item.id || item.name || "";
}

const loanFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  productCode: z.string().optional(),
  businessType: z.string().optional(),
  purpose: z.string().optional(),
  requestRef: z.string().optional(),
});

type LoanFormValues = z.infer<typeof loanFormSchema>;

export function LoanRequestList({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const query = useLoanRequests(orgId, { page: 0, size: 20 });
  const items = asList(query.data);

  if (query.isLoading) return <TableSkeleton rows={5} />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {can("MANAGE_ORGANIZATIONS") && (
          <Link href={`/organizations/${orgId}/loans/new`} className={cn(buttonVariants())}>
            Create loan request
          </Link>
        )}
      </div>
      {!items.length ? (
        <EmptyState title="No loan requests" description="Create a loan request to get started." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-sky-50/80 hover:bg-sky-50/80">
                <TableHead>Request</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CoopStream</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/organizations/${orgId}/loans/${item.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {item.requestRef || item.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatAmount(item.amount, item.currency)}
                  </TableCell>
                  <TableCell>
                    {item.status ? <StatusBadge status={String(item.status)} /> : "—"}
                  </TableCell>
                  <TableCell>
                    {item.coopStreamStatus ? (
                      <StatusBadge status={String(item.coopStreamStatus)} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function LoanRequestDetail({ orgId, loanId }: { orgId: string; loanId: string }) {
  const { can } = useSession();
  const query = useLoanRequest(orgId, loanId);
  const mutations = useLoanMutations(orgId);

  async function onSubmit() {
    try {
      const result = await mutations.submit.mutateAsync(loanId);
      toast.success("Submitted to CoopStream.");
      if (result.coopStreamStatus) {
        toast.message(`CoopStream: ${String(result.coopStreamStatus)}`);
      }
      await query.refetch();
    } catch (error) {
      toast.error(formatOrgApiError(error, "Submit failed."));
    }
  }

  if (query.isLoading) return <TableSkeleton rows={6} />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const loan = query.data;
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Request ID", value: loan.id },
    { label: "Request ref", value: loan.requestRef || "—" },
    { label: "Amount", value: formatAmount(loan.amount, loan.currency) },
    { label: "Currency", value: loan.currency || "—" },
    { label: "Product", value: loan.productCode || loan.productId || "—" },
    { label: "Business type", value: loan.businessType || "—" },
    { label: "Purpose", value: loan.purpose || "—" },
    {
      label: "Status",
      value: loan.status ? <StatusBadge status={String(loan.status)} /> : "—",
    },
    {
      label: "CoopStream",
      value: loan.coopStreamStatus ? (
        <StatusBadge status={String(loan.coopStreamStatus)} />
      ) : (
        "—"
      ),
    },
    { label: "Created", value: formatDate(loan.createdAt) },
    { label: "Submitted", value: formatDate(loan.submittedAt) },
    { label: "Updated", value: formatDate(loan.updatedAt) },
  ];

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b">
          <div>
            <CardTitle>Loan request</CardTitle>
            <CardDescription className="mt-1 font-mono text-xs">{loan.id}</CardDescription>
          </div>
          {can("MANAGE_ORGANIZATIONS") && (
            <Button onClick={() => void onSubmit()} disabled={mutations.submit.isPending}>
              Submit to CoopStream
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-5">
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[130px_1fr] gap-2 text-sm">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-medium break-all">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Link
        href={`/organizations/${orgId}/loans`}
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        Back to list
      </Link>
    </div>
  );
}

export function LoanRequestCreate({ orgId }: { orgId: string }) {
  const router = useRouter();
  const mutations = useLoanMutations(orgId);
  const catalogs = useCatalogs();

  const products = useMemo(
    () => catalogOptions(catalogs.data?.products),
    [catalogs.data?.products],
  );
  const businessTypes = useMemo(
    () => catalogOptions(catalogs.data?.businessTypes),
    [catalogs.data?.businessTypes],
  );

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      amount: 0,
      currency: "ETB",
      productCode: "",
      businessType: "",
      purpose: "",
      requestRef: "",
    },
  });

  async function onSubmit(values: LoanFormValues) {
    try {
      const created = await mutations.create.mutateAsync({
        amount: values.amount,
        currency: values.currency,
        productCode: values.productCode || undefined,
        businessType: values.businessType || undefined,
        purpose: values.purpose || undefined,
        requestRef: values.requestRef || undefined,
      });
      toast.success("Loan request created.");
      router.push(`/organizations/${orgId}/loans/${created.id}`);
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast.error(apiError?.message ?? "Create failed.");
      if (apiError?.fieldErrors?.length) {
        toast.message(apiError.fieldErrors.map((f) => `${f.field}: ${f.message}`).join(" · "));
      }
    }
  }

  return (
    <Card className="max-w-2xl shadow-sm">
      <CardHeader className="border-b">
        <CardTitle>Create loan request</CardTitle>
        <CardDescription>
          Draft requests can be created before TIN validation. Submit requires a validated
          organization.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
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
              name="productCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  {products.length ? (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((item) => {
                          const value = optionValue(item);
                          return (
                            <SelectItem key={value} value={value}>
                              {optionLabel(item)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input placeholder="Product code" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business type</FormLabel>
                  {businessTypes.length ? (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businessTypes.map((item) => {
                          const value = optionValue(item);
                          return (
                            <SelectItem key={value} value={value}>
                              {optionLabel(item)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input placeholder="Business type" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requestRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request reference</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t">
            <Link
              href={`/organizations/${orgId}/loans`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Cancel
            </Link>
            <Button type="submit" disabled={mutations.create.isPending}>
              Create
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
