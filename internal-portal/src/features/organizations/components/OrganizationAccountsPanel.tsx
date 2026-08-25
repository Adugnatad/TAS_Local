"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { orgAccountSchema, type OrgAccountFormValues } from "../schemas";
import { useCreateOrgAccount, useOrgAccounts } from "../hooks";
import { formatOrgApiError } from "../tin";
import { useSession } from "@/features/auth/hooks/useSession";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function OrganizationAccountsPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const canManage = can("MANAGE_ORGANIZATIONS");
  const query = useOrgAccounts(orgId);
  const mutations = useCreateOrgAccount(orgId);
  const form = useForm<OrgAccountFormValues>({
    resolver: zodResolver(orgAccountSchema),
    defaultValues: { currency: "ETB", accountType: "CURRENT", primary: false, accountNo: "" },
  });

  async function onSubmit(values: OrgAccountFormValues) {
    try {
      await mutations.create.mutateAsync(values);
      toast.success("Account added.");
      form.reset({ currency: "ETB", accountType: "CURRENT", primary: false, accountNo: "" });
    } catch (error) {
      toast.error(formatOrgApiError(error, "Create failed."));
    }
  }

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      {!query.data?.length ? (
        <EmptyState title="No accounts" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Primary</TableHead>
              {canManage && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.map((account) => (
              <TableRow key={account.id ?? account.accountNo}>
                <TableCell>{account.accountNo}</TableCell>
                <TableCell>{account.currency}</TableCell>
                <TableCell>{account.accountType}</TableCell>
                <TableCell>{account.primary ? "Yes" : "No"}</TableCell>
                {canManage && (
                  <TableCell className="space-x-1 whitespace-nowrap">
                    {account.id && !account.primary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          mutations.setPrimary
                            .mutateAsync(account.id!)
                            .then(() => toast.success("Primary updated."))
                            .catch((error) => toast.error(formatOrgApiError(error)))
                        }
                      >
                        Set primary
                      </Button>
                    )}
                    {account.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          mutations.remove
                            .mutateAsync(account.id!)
                            .then(() => toast.success("Account removed."))
                            .catch((error) => toast.error(formatOrgApiError(error)))
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {canManage && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-w-xl gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="accountNo"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
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
                <FormItem className="flex items-center gap-2 space-y-0 sm:col-span-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <FormLabel>Primary</FormLabel>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutations.create.isPending}>
              Add account
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
