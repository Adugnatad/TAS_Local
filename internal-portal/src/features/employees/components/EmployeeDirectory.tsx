"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useAssignUserRoles, useCreateEmployee, useEmployees, useVerifyEmployeeId } from "../hooks";
import { formatEmployeeApiError } from "../errors";
import type { Employee } from "../types";
import { useRoles } from "@/features/roles/hooks";
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
    engineerSystemId: z.string().optional(),
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
    if (values.roleNames.includes("BankEngineer") && !values.engineerSystemId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Engineer system ID is required for BankEngineer",
        path: ["engineerSystemId"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function employeeSystemId(employee: Employee): string {
  if (employee.crmSystemId) return employee.crmSystemId;
  if (employee.engineerSystemId) return employee.engineerSystemId;
  return "—";
}

export function EmployeeDirectory() {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [assigning, setAssigning] = useState<Employee | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [verifiedCrmId, setVerifiedCrmId] = useState<string | null>(null);
  const [verifiedEngineerId, setVerifiedEngineerId] = useState<string | null>(null);
  const [crmVerifyError, setCrmVerifyError] = useState<string | null>(null);
  const [engineerVerifyError, setEngineerVerifyError] = useState<string | null>(null);
  const query = useEmployees({ page, size: 20 });
  const create = useCreateEmployee();
  const assign = useAssignUserRoles();
  const verify = useVerifyEmployeeId();
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
      engineerSystemId: "",
      roleNames: ["BankCSE"],
    },
  });
  const roleNames = form.watch("roleNames");
  const crmSystemIdValue = form.watch("crmSystemId");
  const engineerSystemIdValue = form.watch("engineerSystemId");
  const requiresCrmId = roleNames.includes("BankCSE");
  const requiresEngineerId = roleNames.includes("BankEngineer");

  const crmVerified =
    !requiresCrmId || (verifiedCrmId !== null && verifiedCrmId === crmSystemIdValue?.trim());
  const engineerVerified =
    !requiresEngineerId ||
    (verifiedEngineerId !== null && verifiedEngineerId === engineerSystemIdValue?.trim());
  const canCreate = crmVerified && engineerVerified;

  function resetVerifyState() {
    setVerifiedCrmId(null);
    setVerifiedEngineerId(null);
    setCrmVerifyError(null);
    setEngineerVerifyError(null);
  }

  function resetForm() {
    form.reset({
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      crmSystemId: "",
      engineerSystemId: "",
      roleNames: ["BankCSE"],
    });
    resetVerifyState();
  }

  async function onVerifyCse() {
    const systemId = crmSystemIdValue?.trim();
    if (!systemId) {
      setCrmVerifyError("Enter a CRM system ID to verify.");
      setVerifiedCrmId(null);
      return;
    }
    setCrmVerifyError(null);
    try {
      const result = await verify.mutateAsync({ type: "cse", systemId });
      if (!result.valid) {
        setVerifiedCrmId(null);
        setCrmVerifyError("No valid user with that id.");
        return;
      }
      setVerifiedCrmId(systemId);
      if (result.firstName) form.setValue("firstName", result.firstName);
      if (result.lastName) form.setValue("lastName", result.lastName);
      if (result.email) form.setValue("email", result.email);
    } catch (error) {
      setVerifiedCrmId(null);
      setCrmVerifyError(formatEmployeeApiError(error, "Verification failed."));
    }
  }

  async function onVerifyEngineer() {
    const systemId = engineerSystemIdValue?.trim();
    if (!systemId) {
      setEngineerVerifyError("Enter an engineer system ID to verify.");
      setVerifiedEngineerId(null);
      return;
    }
    setEngineerVerifyError(null);
    try {
      const result = await verify.mutateAsync({ type: "engineer", systemId });
      if (!result.valid) {
        setVerifiedEngineerId(null);
        setEngineerVerifyError("No valid user with that id.");
        return;
      }
      setVerifiedEngineerId(systemId);
      if (result.firstName) form.setValue("firstName", result.firstName);
      if (result.lastName) form.setValue("lastName", result.lastName);
      if (result.email) form.setValue("email", result.email);
    } catch (error) {
      setVerifiedEngineerId(null);
      setEngineerVerifyError(formatEmployeeApiError(error, "Verification failed."));
    }
  }

  async function onSubmit(values: FormValues) {
    if (!canCreate) {
      toast.error("Verify required system IDs before creating.");
      return;
    }
    try {
      await create.mutateAsync({
        username: values.username,
        password: values.password,
        email: values.email || undefined,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        crmSystemId: values.crmSystemId?.trim() || undefined,
        engineerSystemId: values.engineerSystemId?.trim() || undefined,
        roles: values.roleNames,
      });
      toast.success("Employee created.");
      setOpen(false);
      resetForm();
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
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) resetForm();
            }}
          >
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
                                  resetVerifyState();
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
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="CSE-0001"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setVerifiedCrmId(null);
                                  setCrmVerifyError(null);
                                }}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={verify.isPending}
                              onClick={() => void onVerifyCse()}
                            >
                              Verify
                            </Button>
                          </div>
                          {verifiedCrmId === crmSystemIdValue?.trim() && (
                            <p className="flex items-center gap-1 text-sm text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Verified
                            </p>
                          )}
                          {crmVerifyError && (
                            <p className="text-sm text-destructive">{crmVerifyError}</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {requiresEngineerId && (
                    <FormField
                      control={form.control}
                      name="engineerSystemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Engineer system ID</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="ENG-0001"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setVerifiedEngineerId(null);
                                  setEngineerVerifyError(null);
                                }}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={verify.isPending}
                              onClick={() => void onVerifyEngineer()}
                            >
                              Verify
                            </Button>
                          </div>
                          {verifiedEngineerId === engineerSystemIdValue?.trim() && (
                            <p className="flex items-center gap-1 text-sm text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Verified
                            </p>
                          )}
                          {engineerVerifyError && (
                            <p className="text-sm text-destructive">{engineerVerifyError}</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button type="submit" disabled={create.isPending || !canCreate}>
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
              <TableHead>System ID</TableHead>
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
                <TableCell>{employeeSystemId(employee)}</TableCell>
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
