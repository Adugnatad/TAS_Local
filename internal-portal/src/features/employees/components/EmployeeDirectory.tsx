"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAssignUserRoles, useCreateEmployee, useEmployees } from "../hooks";
import { useRoles } from "@/features/roles/hooks";
import { ApiError } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
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

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  rolesText: z.string().min(1, "At least one role name, e.g. BankCSE"),
});

type FormValues = z.infer<typeof schema>;

export function EmployeeDirectory() {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const query = useEmployees({ page, size: 20 });
  const create = useCreateEmployee();
  const assign = useAssignUserRoles();
  const roles = useRoles({ scope: "EMPLOYEE" });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", rolesText: "BankCSE" },
  });

  async function onSubmit(values: FormValues) {
    try {
      await create.mutateAsync({
        username: values.username,
        password: values.password,
        email: values.email || undefined,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        roles: values.rolesText.split(",").map((r) => r.trim()).filter(Boolean),
      });
      toast.success("Employee created.");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Create failed.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Bank staff accounts. Requires MANAGE_EMPLOYEES."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button>Add employee</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create employee</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rolesText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roles (comma-separated names)</FormLabel>
                        <FormControl>
                          <Input placeholder="BankCSE" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={create.isPending}>
                    Create
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {query.isLoading ? (
        <TableSkeleton rows={8} />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data?.content.length ? (
        <EmptyState title="No employees" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.content.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.username}</TableCell>
                <TableCell>
                  {[employee.firstName, employee.lastName].filter(Boolean).join(" ") || "—"}
                </TableCell>
                <TableCell>{employee.roles.join(", ")}</TableCell>
                <TableCell>
                  <StatusBadge status={employee.status} />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!roles.data?.length}
                    onClick={() => {
                      const ids = window.prompt(
                        "Role IDs (comma-separated UUIDs)",
                        roles.data?.map((r) => r.id).join(",") ?? "",
                      );
                      if (!ids) return;
                      assign
                        .mutateAsync({
                          userId: employee.id,
                          roleIds: ids.split(",").map((id) => id.trim()).filter(Boolean),
                        })
                        .then(() => toast.success("Roles updated."))
                        .catch((error: unknown) =>
                          toast.error(error instanceof ApiError ? error.message : "Assign failed."),
                        );
                    }}
                  >
                    Assign roles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {query.data && query.data.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={query.data.last}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
