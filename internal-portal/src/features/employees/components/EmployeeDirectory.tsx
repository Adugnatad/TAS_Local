"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAssignUserRoles, useCreateEmployee, useEmployees } from "../hooks";
import type { Employee } from "../types";
import { useRoles } from "@/features/roles/hooks";
import { ApiError } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

const schema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(8),
    email: z.string().email().optional().or(z.literal("")),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    crmSystemId: z.string().optional(),
    roleNames: z.array(z.string()).min(1, "Select at least one role"),
  })
  .superRefine((values, ctx) => {
    if (values.roleNames.includes("BankCSE") && !values.crmSystemId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CRM system ID is required for BankCSE",
        path: ["crmSystemId"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function formatEmployeeApiError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === "CRM_ID_REQUIRED") return "CRM system ID is required for BankCSE employees.";
  if (error.code === "CRM_ID_EXISTS") {
    return "This CRM system ID is already assigned to another user.";
  }
  if (error.code === "USERNAME_TAKEN") return "That username is already taken.";
  if (error.code === "UNKNOWN_ROLE") return "One or more selected roles are unknown.";
  return error.message || fallback;
}

export function EmployeeDirectory() {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [assigning, setAssigning] = useState<Employee | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const query = useEmployees({ page, size: 20 });
  const create = useCreateEmployee();
  const assign = useAssignUserRoles();
  const roles = useRoles({ scope: "EMPLOYEE" });
  const employeeRoles = useMemo(
    () => (roles.data ?? []).filter((role) => role.status === "ACTIVE"),
    [roles.data],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      crmSystemId: "",
      roleNames: ["BankCSE"],
    },
  });
  const roleNames = form.watch("roleNames");
  const requiresCrmId = roleNames.includes("BankCSE");

  async function onSubmit(values: FormValues) {
    try {
      await create.mutateAsync({
        username: values.username,
        password: values.password,
        email: values.email || undefined,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        crmSystemId: values.crmSystemId?.trim() || undefined,
        roles: values.roleNames,
      });
      toast.success("Employee created.");
      setOpen(false);
      form.reset({
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        crmSystemId: "",
        roleNames: ["BankCSE"],
      });
    } catch (error) {
      toast.error(formatEmployeeApiError(error, "Create failed."));
    }
  }

  function openAssign(employee: Employee) {
    const matchedIds = employeeRoles
      .filter((role) => employee.roles.includes(role.name))
      .map((role) => role.id);
    setAssigning(employee);
    setSelectedRoleIds(matchedIds);
  }

  async function onAssign() {
    if (!assigning) return;
    if (!selectedRoleIds.length) {
      toast.error("Select at least one role.");
      return;
    }
    try {
      await assign.mutateAsync({ userId: assigning.id, roleIds: selectedRoleIds });
      toast.success("Roles updated.");
      setAssigning(null);
    } catch (error) {
      toast.error(formatEmployeeApiError(error, "Assign failed."));
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
            <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                    name="roleNames"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roles</FormLabel>
                        <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                          {employeeRoles.map((role) => (
                            <label
                              key={role.id}
                              className="flex cursor-pointer items-center gap-2 text-sm"
                            >
                              <Checkbox
                                checked={field.value.includes(role.name)}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...field.value, role.name]
                                    : field.value.filter((name) => name !== role.name);
                                  field.onChange(next);
                                }}
                              />
                              {role.name}
                            </label>
                          ))}
                          {!employeeRoles.length && (
                            <p className="text-sm text-muted-foreground">No employee roles loaded.</p>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {requiresCrmId && (
                    <FormField
                      control={form.control}
                      name="crmSystemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CRM system ID</FormLabel>
                          <FormControl>
                            <Input placeholder="CSE-0001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
              <TableHead>Phone</TableHead>
              <TableHead>CRM ID</TableHead>
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
                <TableCell>{employee.phone ?? "—"}</TableCell>
                <TableCell>{employee.crmSystemId ?? "—"}</TableCell>
                <TableCell>{employee.roles.join(", ")}</TableCell>
                <TableCell>
                  <StatusBadge status={employee.status} />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!employeeRoles.length}
                    onClick={() => openAssign(employee)}
                  >
                    Assign roles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={Boolean(assigning)}
        onOpenChange={(openState) => {
          if (!openState) setAssigning(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign roles — {assigning?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Employee roles</Label>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
              {employeeRoles.map((role) => (
                <label key={role.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={(e) =>
                      setSelectedRoleIds((current) =>
                        e.target.checked
                          ? [...current, role.id]
                          : current.filter((id) => id !== role.id),
                      )
                    }
                  />
                  {role.name}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssigning(null)}>
                Cancel
              </Button>
              <Button onClick={() => void onAssign()} disabled={assign.isPending}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
