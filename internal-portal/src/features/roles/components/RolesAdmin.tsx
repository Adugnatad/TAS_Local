"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePermissionsCatalog, useRoleMutations, useRoles } from "../hooks";
import { useSession } from "@/features/auth/hooks/useSession";
import { PERMISSION_LABELS } from "@/lib/constants";
import { ApiError } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RolesAdmin() {
  const { can } = useSession();
  const canManage = can("MANAGE_ROLES");
  const query = useRoles({ scope: "EMPLOYEE" });
  const permissions = usePermissionsCatalog();
  const mutations = useRoleMutations();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [scope, setScope] = useState("EMPLOYEE");

  async function onCreate() {
    try {
      await mutations.create.mutateAsync({
        name,
        scope,
        description,
        permissions: selected,
      });
      toast.success("Role created.");
      setName("");
      setDescription("");
      setSelected([]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Create failed.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Permissions are fixed. Roles can be created at runtime for EMPLOYEE or ORGANIZATION scope."
      />

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState title="No roles" />
      ) : (
        <ul className="space-y-3">
          {query.data.map((role) => (
            <li key={role.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{role.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {role.scope} · {role.users} users · {role.description}
                  </p>
                  <p className="mt-1 text-xs">{role.permissions.join(", ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={role.status} />
                  {canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        mutations.setActive.mutateAsync({
                          id: role.id,
                          active: role.status !== "ACTIVE",
                        })
                      }
                    >
                      {role.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {can("MANAGE_ROLES") || can("MANAGE_PERMISSIONS") ? (
        <div>
          <h2 className="mb-2 text-lg font-semibold">Permission catalog</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(permissions.data ?? []).map((item) => (
              <li key={item.id} className="rounded-md border px-3 py-2 text-sm">
                <p className="font-medium">{item.code}</p>
                <p className="text-muted-foreground">{item.description}</p>
                <p className="text-xs">
                  {item.roles} roles · {item.users} users
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canManage && (
        <div className="max-w-xl space-y-3 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Create role</h2>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
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
          <div className="space-y-1">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Permissions</Label>
            {(permissions.data ?? []).map((item) => (
              <label key={item.code} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selected.includes(item.code)}
                  onChange={(e) =>
                    setSelected((current) =>
                      e.target.checked
                        ? [...current, item.code]
                        : current.filter((code) => code !== item.code),
                    )
                  }
                />
                {PERMISSION_LABELS[item.code] ?? item.code}
              </label>
            ))}
          </div>
          <Button onClick={onCreate} disabled={!name}>
            Create role
          </Button>
        </div>
      )}
    </div>
  );
}
