"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  useCreateSignatory,
  useSignatories,
  useUpdateSignatory,
} from "../hooks/useSignatories";
import { signatorySchema, type SignatoryFormValues } from "../schemas";
import type { Signatory } from "../types";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useSignatoryTitles } from "@/features/settings/hooks/useSettings";
import { useCan } from "@/features/settings/hooks/useCan";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface SignatoryListProps {
  customerId: string;
}

function SignatoryFormDialog({
  customerId,
  signatory,
  onClose,
}: {
  customerId: string;
  signatory?: Signatory;
  onClose: () => void;
}) {
  const createMutation = useCreateSignatory(customerId);
  const updateMutation = useUpdateSignatory(customerId);
  const { data: titles = [] } = useSignatoryTitles();
  const isEdit = !!signatory;
  const titleOptions = titles.filter(
    (title) => title.isActive || title.name === signatory?.role,
  );

  const form = useForm<SignatoryFormValues>({
    resolver: zodResolver(signatorySchema),
    defaultValues: {
      fullName: signatory?.fullName ?? "",
      role: signatory?.role ?? "",
      signatureLimit: signatory?.signatureLimit ?? 0,
      isActive: signatory?.isActive ?? true,
    },
  });

  async function onSubmit(values: SignatoryFormValues) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ signatoryId: signatory.id, input: values });
        toast.success("Signatory updated.");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Signatory added.");
      }
      onClose();
    } catch {
      toast.error("Failed to save signatory.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection
          title="Signatory identity"
          description="Name and corporate title used in the approval matrix."
          columns={2}
        >
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Roberto Garcia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger aria-label="Role">
                      <SelectValue placeholder="Select a title" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {titleOptions.map((title) => (
                      <SelectItem key={title.id} value={title.name}>
                        {title.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>From the COOP signatory title catalog.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="signatureLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Signature limit (PHP)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormDescription>Maximum amount this person may cover alone.</FormDescription>
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
            {isEdit ? "Save signatory" : "Add signatory"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function SignatoryList({ customerId }: SignatoryListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSignatory, setEditingSignatory] = useState<Signatory | undefined>();
  const { data, isLoading, isError, refetch } = useSignatories(customerId);
  const updateMutation = useUpdateSignatory(customerId);
  const canManage = useCan("signatories.manage");

  async function toggleActive(signatory: Signatory) {
    try {
      await updateMutation.mutateAsync({
        signatoryId: signatory.id,
        input: { isActive: !signatory.isActive },
      });
      toast.success(signatory.isActive ? "Signatory deactivated." : "Signatory activated.");
    } catch {
      toast.error("Failed to update signatory status.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Signatories</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Authorized people and their signing limits for this customer.
          </p>
        </div>
        {canManage && (
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingSignatory(undefined);
          }}
        >
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Add Signatory
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSignatory ? "Edit signatory" : "Add signatory"}
              </DialogTitle>
              <DialogDescription>
                {editingSignatory
                  ? "Update this person’s title and signing authority."
                  : "Add an authorized signatory for this corporate customer."}
              </DialogDescription>
            </DialogHeader>
            <SignatoryFormDialog
              customerId={customerId}
              signatory={editingSignatory}
              onClose={() => {
                setDialogOpen(false);
                setEditingSignatory(undefined);
              }}
            />
          </DialogContent>
        </Dialog>
        )}
      </div>

      {isLoading && <TableSkeleton rows={4} columns={4} />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.length === 0 && (
        <EmptyState
          title="No signatories"
          description="Add signatories to configure the approval matrix."
        />
      )}
      {!isLoading && !isError && data && data.length > 0 && (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((signatory) => (
                <TableRow key={signatory.id}>
                  <TableCell className="font-medium">{signatory.fullName}</TableCell>
                  <TableCell>{signatory.role}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(signatory.signatureLimit)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={signatory.isActive ? "default" : "secondary"}>
                      {signatory.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canManage ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${signatory.fullName}`}
                        onClick={() => {
                          setEditingSignatory(signatory);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(signatory)}
                      >
                        {signatory.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </Card>
      )}
    </div>
  );
}
