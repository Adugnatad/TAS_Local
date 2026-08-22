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
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";

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
  const isEdit = !!signatory;

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Managing Director" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="signatureLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Signature Limit (PHP)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {isEdit ? "Update" : "Add Signatory"}
        </Button>
      </form>
    </Form>
  );
}

export function SignatoryList({ customerId }: SignatoryListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSignatory, setEditingSignatory] = useState<Signatory | undefined>();
  const { data, isLoading, isError, refetch } = useSignatories(customerId);
  const updateMutation = useUpdateSignatory(customerId);

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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Signatories</h3>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingSignatory(undefined);
          }}
        >
          <DialogTrigger
            render={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Add Signatory
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSignatory ? "Edit Signatory" : "Add Signatory"}
              </DialogTitle>
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
        <div className="rounded-md border">
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
