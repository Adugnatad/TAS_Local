"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { orgUserUpdateSchema, type OrgUserUpdateFormValues } from "../schemas";
import { useOrganization, useOrgUserMutations, useOrgUsers } from "../hooks";
import { formatOrgApiError } from "../tin";
import type { OrganizationUser } from "../types";
import { useSession } from "@/features/auth/hooks/useSession";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

type RolePermissionValues = {
  role: "Admin" | "User";
  permissionType: "INITIATE" | "APPROVE" | "VIEW";
};

function RolePermissionFields({ control }: { control: Control<RolePermissionValues> }) {
  return (
    <>
      <FormField
        control={control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <Select value={field.value} onValueChange={(value) => value && field.onChange(value)}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="permissionType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Permission type</FormLabel>
            <Select value={field.value} onValueChange={(value) => value && field.onChange(value)}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="INITIATE">INITIATE</SelectItem>
                <SelectItem value="APPROVE">APPROVE</SelectItem>
                <SelectItem value="VIEW">VIEW</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

export function OrganizationUsersPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const canManage = can("MANAGE_ORGANIZATIONS");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<OrganizationUser | null>(null);
  const org = useOrganization(orgId);
  const query = useOrgUsers(orgId, { page, size: 20 });
  const mutations = useOrgUserMutations(orgId);
  const hasCse = Boolean(org.data?.assignedCseUserId);

  const editForm = useForm<OrgUserUpdateFormValues>({
    resolver: zodResolver(orgUserUpdateSchema),
    values: {
      email: editing?.email ?? "",
      firstName: editing?.firstName ?? "",
      lastName: editing?.lastName ?? "",
      phone: editing?.phone ?? "",
      role: (editing?.role as "Admin" | "User") || "User",
      permissionType: (editing?.permissionType as "INITIATE" | "APPROVE" | "VIEW") || "VIEW",
    },
  });

  async function onEdit(values: OrgUserUpdateFormValues) {
    if (!editing) return;
    try {
      await mutations.update.mutateAsync({
        userId: editing.id,
        input: {
          ...values,
          email: values.email || undefined,
        },
      });
      toast.success("User updated.");
      setEditing(null);
    } catch (error) {
      toast.error(formatOrgApiError(error, "Update failed."));
    }
  }

  return (
    <div className="space-y-4">
      {!hasCse && !org.isLoading && (
        <Alert>
          <AlertTitle>CSE required</AlertTitle>
          <AlertDescription>
            A CSE must be assigned before adding users. Assign one from the organization overview.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end">
        {canManage &&
          (hasCse ? (
            <Link href={`/organizations/${orgId}/users/new`} className={cn(buttonVariants())}>
              Add user
            </Link>
          ) : (
            <Button disabled title="A CSE must be assigned before adding users.">
              Add user
            </Button>
          ))}
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={6} />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data?.content.length ? (
        <EmptyState title="No users" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.content.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                </TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.permissionType}</TableCell>
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                {canManage && (
                  <TableCell className="space-x-1 whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => setEditing(user)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        mutations.setActive
                          .mutateAsync({
                            userId: user.id,
                            active: user.status !== "ACTIVE",
                          })
                          .then(() => toast.success("Status updated."))
                          .catch((error) => toast.error(formatOrgApiError(error)))
                      }
                    >
                      {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newPassword = window.prompt("New password (min 8 characters)");
                        if (!newPassword || newPassword.length < 8) {
                          if (newPassword) toast.error("Password must be at least 8 characters.");
                          return;
                        }
                        mutations.resetPassword
                          .mutateAsync({ userId: user.id, newPassword })
                          .then(() => toast.success("Password reset."))
                          .catch((error) => toast.error(formatOrgApiError(error)));
                      }}
                    >
                      Reset password
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.username}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="grid gap-3">
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
              <RolePermissionFields
                control={editForm.control as unknown as Control<RolePermissionValues>}
              />
              <Button type="submit" disabled={mutations.update.isPending}>
                Save
              </Button>
            </form>
          </Form>
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
