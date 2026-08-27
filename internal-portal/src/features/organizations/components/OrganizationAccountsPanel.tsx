"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { orgAccountSchema, type OrgAccountFormValues } from "../schemas";
import { useCreateOrgAccount, useOrgAccounts } from "../hooks";
import { formatOrgApiError } from "../tin";
import type { OrgAccount } from "../types";
import { useSession } from "@/features/auth/hooks/useSession";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [editing, setEditing] = useState<OrgAccount | null>(null);
  const form = useForm<OrgAccountFormValues>({
    resolver: zodResolver(orgAccountSchema),
    defaultValues: { currency: "ETB", accountType: "CURRENT", primary: false, accountNo: "" },
  });
  const editForm = useForm<OrgAccountFormValues>({
    resolver: zodResolver(orgAccountSchema),
    values: {
      accountNo: editing?.accountNo ?? "",
      currency: editing?.currency ?? "ETB",
      accountType: editing?.accountType ?? "CURRENT",
      primary: editing?.primary ?? false,
    },
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

  async function onEdit(values: OrgAccountFormValues) {
    if (!editing?.id) return;
    try {
      await mutations.update.mutateAsync({ accountId: editing.id, input: values });
      toast.success("Account updated.");
      setEditing(null);
    } catch (error) {
      toast.error(formatOrgApiError(error, "Update failed."));
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
                    {account.id && (
                      <Button size="sm" variant="outline" onClick={() => setEditing(account)}>
                        Edit
                      </Button>
                    )}
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

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit account</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="grid gap-3">
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
                name="primary"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
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
              <Button type="submit" disabled={mutations.update.isPending}>
                Save
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
