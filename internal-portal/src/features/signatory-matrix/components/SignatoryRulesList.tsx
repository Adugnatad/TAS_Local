"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  useCreateSignatoryRule,
  useDeleteSignatoryRule,
  useSignatoryRules,
} from "../hooks/useSignatories";
import { signatoryRuleSchema, type SignatoryRuleFormValues } from "../schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";

interface SignatoryRulesListProps {
  customerId: string;
}

export function SignatoryRulesList({ customerId }: SignatoryRulesListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useSignatoryRules(customerId);
  const createMutation = useCreateSignatoryRule(customerId);
  const deleteMutation = useDeleteSignatoryRule(customerId);

  const form = useForm<SignatoryRuleFormValues>({
    resolver: zodResolver(signatoryRuleSchema),
    defaultValues: {
      minSignatories: 1,
      requiredRoles: [],
      amountThreshold: 0,
    },
  });

  async function onSubmit(values: SignatoryRuleFormValues) {
    try {
      const requiredRoles = values.requiredRoles?.filter(Boolean);
      await createMutation.mutateAsync({
        ...values,
        requiredRoles: requiredRoles?.length ? requiredRoles : undefined,
      });
      toast.success("Rule added.");
      setDialogOpen(false);
      form.reset();
    } catch {
      toast.error("Failed to add rule.");
    }
  }

  async function handleDelete(ruleId: string) {
    try {
      await deleteMutation.mutateAsync(ruleId);
      toast.success("Rule deleted.");
    } catch {
      toast.error("Failed to delete rule.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Signatory Rules</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Add Rule
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Signatory Rule</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="minSignatories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Signatories</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amountThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Threshold (PHP)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiredRoles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Roles (comma-separated, optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Managing Director, CFO"
                          value={field.value?.join(", ") ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                .split(",")
                                .map((r) => r.trim())
                                .filter(Boolean),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createMutation.isPending}>
                  Add Rule
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <TableSkeleton rows={3} columns={4} />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.length === 0 && (
        <EmptyState title="No rules configured" description="Add rules to define approval requirements." />
      )}
      {!isLoading && !isError && data && data.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Min Signatories</TableHead>
                <TableHead>Amount Threshold</TableHead>
                <TableHead>Required Roles</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.minSignatories}</TableCell>
                  <TableCell>{formatCurrency(rule.amountThreshold)}</TableCell>
                  <TableCell>
                    {rule.requiredRoles?.length ? rule.requiredRoles.join(", ") : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete rule"
                      onClick={() => handleDelete(rule.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
