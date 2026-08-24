"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  useCreateSignatoryRule,
  useDeleteSignatoryRule,
  useSignatoryRules,
  useUpdateSignatoryRule,
} from "../hooks/useSignatories";
import { signatoryRuleSchema, type SignatoryRuleFormValues } from "../schemas";
import type { CreateSignatoryRuleInput, SignatoryRule } from "../types";
import { useSignatoryTitles } from "@/features/settings/hooks/useSettings";
import { useCan } from "@/features/settings/hooks/useCan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormSection } from "@/components/ui/form-section";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";

interface SignatoryRulesListProps {
  customerId: string;
}

function toPayload(values: SignatoryRuleFormValues): CreateSignatoryRuleInput {
  const max =
    values.maxSignatories === "" || values.maxSignatories === undefined
      ? undefined
      : Number(values.maxSignatories);
  const requiredRoles = values.requiredRoles?.filter(Boolean);
  return {
    minSignatories: Number(values.minSignatories),
    maxSignatories: max,
    requiredRoles: requiredRoles?.length ? requiredRoles : undefined,
    roleMatch: values.roleMatch,
    dualControl: values.dualControl,
    amountThreshold: Number(values.amountThreshold),
  };
}

function RuleFormDialog({
  customerId,
  rule,
  onClose,
}: {
  customerId: string;
  rule?: SignatoryRule;
  onClose: () => void;
}) {
  const createMutation = useCreateSignatoryRule(customerId);
  const updateMutation = useUpdateSignatoryRule(customerId);
  const { data: titles = [] } = useSignatoryTitles();
  const isEdit = !!rule;

  const form = useForm<SignatoryRuleFormValues>({
    resolver: zodResolver(signatoryRuleSchema),
    defaultValues: {
      minSignatories: rule?.minSignatories ?? 1,
      maxSignatories: rule?.maxSignatories ?? "",
      requiredRoles: rule?.requiredRoles ?? [],
      roleMatch: rule?.roleMatch ?? "all",
      dualControl: rule?.dualControl ?? false,
      amountThreshold: rule?.amountThreshold ?? 0,
    },
  });

  async function onSubmit(values: SignatoryRuleFormValues) {
    try {
      const payload = toPayload(values);
      if (isEdit) {
        await updateMutation.mutateAsync({ ruleId: rule.id, input: payload });
        toast.success("Rule updated.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Rule added.");
      }
      onClose();
    } catch {
      toast.error("Failed to save rule.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection
          title="Thresholds"
          description="This rule applies when the request amount is at or above the threshold."
          columns={2}
        >
          <FormField
            control={form.control}
            name="amountThreshold"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Amount threshold (PHP)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minSignatories"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum signatories</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxSignatories"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="No cap"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
        <FormSection title="Role requirements" description="Which corporate titles must appear in a valid combination.">
          <FormField
            control={form.control}
            name="roleMatch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Match mode</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger aria-label="Role match">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All selected titles required</SelectItem>
                    <SelectItem value="any">Any one selected title is enough</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="requiredRoles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required titles</FormLabel>
                <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
                  {titles.map((title) => {
                    const checked = field.value?.includes(title.name) ?? false;
                    return (
                      <label key={title.id} className="flex items-center gap-2.5 text-sm">
                        <Checkbox
                          checked={checked}
                          onChange={(event) => {
                            const next = new Set(field.value ?? []);
                            if (event.target.checked) next.add(title.name);
                            else next.delete(title.name);
                            field.onChange(Array.from(next));
                          }}
                        />
                        <span>
                          {title.name}
                          {!title.isActive && (
                            <span className="ml-1 text-xs text-muted-foreground">(inactive)</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dualControl"
            render={({ field }) => (
              <FormItem>
                <label className="flex items-start gap-3 rounded-lg border bg-card p-3 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  <span>
                    <span className="font-medium">Dual control</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      At least two distinct people must sign, even if one limit covers the amount.
                    </span>
                  </span>
                </label>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? "Save rule" : "Add rule"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function SignatoryRulesList({ customerId }: SignatoryRulesListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SignatoryRule | undefined>();
  const { data, isLoading, isError, refetch } = useSignatoryRules(customerId);
  const deleteMutation = useDeleteSignatoryRule(customerId);
  const canManage = useCan("rules.manage");

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
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Signatory rules</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Amount thresholds and title requirements for valid combinations.
          </p>
        </div>
        {canManage && (
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setEditingRule(undefined);
            }}
          >
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Add Rule
                </Button>
              }
            />
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingRule ? "Edit signatory rule" : "Add signatory rule"}</DialogTitle>
                <DialogDescription>
                  Define how many people and which titles are required above an amount threshold.
                </DialogDescription>
              </DialogHeader>
              <RuleFormDialog
                customerId={customerId}
                rule={editingRule}
                onClose={() => {
                  setDialogOpen(false);
                  setEditingRule(undefined);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading && <TableSkeleton rows={3} columns={6} />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.length === 0 && (
        <EmptyState title="No rules configured" description="Add rules to define approval requirements." />
      )}
      {!isLoading && !isError && data && data.length > 0 && (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Min / Max</TableHead>
                <TableHead>Amount Threshold</TableHead>
                <TableHead>Required Roles</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Dual Control</TableHead>
                {canManage && <TableHead className="w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    {rule.minSignatories}
                    {rule.maxSignatories ? `–${rule.maxSignatories}` : "+"}
                  </TableCell>
                  <TableCell>{formatCurrency(rule.amountThreshold)}</TableCell>
                  <TableCell>
                    {rule.requiredRoles?.length ? rule.requiredRoles.join(", ") : "—"}
                  </TableCell>
                  <TableCell className="capitalize">{rule.roleMatch ?? "all"}</TableCell>
                  <TableCell>{rule.dualControl ? "Yes" : "No"}</TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit rule"
                          onClick={() => {
                            setEditingRule(rule);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete rule"
                          onClick={() => handleDelete(rule.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
