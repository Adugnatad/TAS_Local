"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  useCreateSignatoryTitle,
  useSignatoryTitles,
  useUpdateSignatoryTitle,
} from "../hooks/useSettings";
import { signatoryTitleSchema, type SignatoryTitleFormValues } from "@/features/signatory-matrix/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useCan } from "../hooks/useCan";

export function SignatoryTitleSettings() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useSignatoryTitles();
  const createMutation = useCreateSignatoryTitle();
  const updateMutation = useUpdateSignatoryTitle();
  const canManage = useCan("settings.manage");

  const form = useForm<SignatoryTitleFormValues>({
    resolver: zodResolver(signatoryTitleSchema),
    defaultValues: { name: "", isActive: true },
  });

  async function onSubmit(values: SignatoryTitleFormValues) {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Title added.");
      setOpen(false);
      form.reset({ name: "", isActive: true });
    } catch {
      toast.error("Failed to add title.");
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await updateMutation.mutateAsync({ titleId: id, input: { isActive: !isActive } });
      toast.success(isActive ? "Title deactivated." : "Title activated.");
    } catch {
      toast.error("Failed to update title.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Signatory titles</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Catalog used when assigning roles to signatories and rules.
          </p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Add Title</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add signatory title</DialogTitle>
                <DialogDescription>
                  New titles can be assigned to signatories and required on approval rules.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Treasurer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      Add title
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading && <TableSkeleton rows={5} columns={3} />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {data && (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="w-32">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((title) => (
                <TableRow key={title.id}>
                  <TableCell className="font-medium">{title.name}</TableCell>
                  <TableCell>
                    <Badge variant={title.isActive ? "default" : "secondary"}>
                      {title.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(title.id, title.isActive)}
                      >
                        {title.isActive ? "Deactivate" : "Activate"}
                      </Button>
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
