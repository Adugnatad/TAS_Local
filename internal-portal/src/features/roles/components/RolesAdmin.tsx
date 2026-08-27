"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { usePermissionsCatalog, useRoleMutations, useRoles } from "../hooks";
import { useSession } from "@/features/auth/hooks/useSession";
import { PERMISSION_LABELS } from "@/lib/constants";
import { ApiError } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

export function RolesAdmin() {
  const { can } = useSession();
  const canManage = can("MANAGE_ROLES");
  const canViewCatalog = can("MANAGE_ROLES") || can("MANAGE_PERMISSIONS");
  const [scopeFilter, setScopeFilter] = useState<"EMPLOYEE" | "ORGANIZATION" | "ALL">(
    "EMPLOYEE",
  );
  const query = useRoles({
    scope: scopeFilter === "ALL" ? undefined : scopeFilter,
  });
  const permissions = usePermissionsCatalog();
  const mutations = useRoleMutations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [scope, setScope] = useState("EMPLOYEE");

  const roles = useMemo(() => query.data ?? [], [query.data]);

  async function onCreate() {
    try {
      await mutations.create.mutateAsync({
        name: name.trim(),
        scope,
        description: description.trim() || undefined,
        permissions: selected,
      });
      toast.success("Role created.");
      setName("");
      setDescription("");
      setSelected([]);
      setScope("EMPLOYEE");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Create failed.");
    }
  }

  async function onToggleActive(id: string, currentlyActive: boolean) {
    try {
      await mutations.setActive.mutateAsync({ id, active: !currentlyActive });
      toast.success(currentlyActive ? "Role deactivated." : "Role activated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Update failed.");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Roles & permissions"
        description="Manage employee and organization roles. Permission codes are fixed; roles group them for assignment."
        actions={
          canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button><Plus className="size-4" /> Create role</Button>} />
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="role-name">Name</Label>
                    <Input
                      id="role-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. BankCSE"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Scope</Label>
                    <Select value={scope} onValueChange={(value) => value && setScope(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPLOYEE">EMPLOYEE</SelectItem>
                        <SelectItem value="ORGANIZATION">ORGANIZATION</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="role-description">Description</Label>
                    <Input
                      id="role-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                      {(permissions.data ?? []).map((item) => (
                        <label
                          key={item.code}
                          className="flex cursor-pointer items-start gap-2.5 text-sm"
                        >
                          <Checkbox
                            className="mt-0.5"
                            checked={selected.includes(item.code)}
                            onChange={(e) =>
                              setSelected((current) =>
                                e.target.checked
                                  ? [...current, item.code]
                                  : current.filter((code) => code !== item.code),
                              )
                            }
                          />
                          <span>
                            <span className="font-medium">
                              {PERMISSION_LABELS[item.code] ?? item.code}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {item.code}
                            </span>
                          </span>
                        </label>
                      ))}
                      {!permissions.data?.length && (
                        <p className="text-sm text-muted-foreground">No permissions loaded.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => void onCreate()}
                      disabled={!name.trim() || mutations.create.isPending}
                    >
                      Create role
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-muted-foreground">Scope</Label>
        <Select
          value={scopeFilter}
          onValueChange={(value) =>
            value && setScopeFilter(value as "EMPLOYEE" | "ORGANIZATION" | "ALL")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EMPLOYEE">Employee</SelectItem>
            <SelectItem value="ORGANIZATION">Organization</SelectItem>
            <SelectItem value="ALL">All scopes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={6} />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !roles.length ? (
        <EmptyState title="No roles" description="Create a role to get started." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-sky-50/80 hover:bg-sky-50/80">
                <TableHead>Role</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="w-28" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <p className="font-medium">{role.name}</p>
                    {role.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{role.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.scope}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{role.users}</TableCell>
                  <TableCell>
                    <div className="flex max-w-md flex-wrap gap-1">
                      {role.permissions.length ? (
                        role.permissions.map((code) => (
                          <Badge key={code} variant="secondary" className="font-normal">
                            {PERMISSION_LABELS[code] ?? code}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={role.status} />
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mutations.setActive.isPending}
                        onClick={() => void onToggleActive(role.id, role.status === "ACTIVE")}
                      >
                        {role.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {canViewCatalog && (
        <section className="space-y-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-sky-800">
              <span className="h-4 w-1 rounded-full bg-primary" aria-hidden />
              Permission catalog
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fixed permission codes available when building roles.
            </p>
          </div>
          {permissions.isLoading ? (
            <TableSkeleton rows={4} />
          ) : permissions.isError ? (
            <ErrorState onRetry={() => permissions.refetch()} />
          ) : !permissions.data?.length ? (
            <EmptyState title="No permissions" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {permissions.data.map((item) => (
                <Card key={item.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {PERMISSION_LABELS[item.code] ?? item.code}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">{item.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.roles} roles · {item.users} users
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
