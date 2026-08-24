"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CAPABILITIES,
  CAPABILITY_LABELS,
  OFFICER_ROLES,
  ROLE_LABELS,
  type Capability,
  type OfficerRole,
} from "@/lib/constants";
import { useRolePermissions, useUpdateRolePermissions } from "../hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";

export function RolePermissionsMatrix() {
  const { data, isLoading, isError, refetch } = useRolePermissions();
  const updateMutation = useUpdateRolePermissions();
  const [draft, setDraft] = useState<Record<OfficerRole, Capability[]> | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  function toggle(role: OfficerRole, capability: Capability) {
    if (!draft) return;
    const current = new Set(draft[role]);
    if (current.has(capability)) current.delete(capability);
    else current.add(capability);
    setDraft({ ...draft, [role]: Array.from(current) });
  }

  async function onSave() {
    if (!draft) return;
    try {
      await updateMutation.mutateAsync(draft);
      toast.success("Role permissions saved.");
    } catch {
      toast.error("Failed to save permissions.");
    }
  }

  if (isLoading || !draft) return <TableSkeleton rows={5} columns={4} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Portal role permissions</CardTitle>
        <CardDescription>
          Grant or revoke capabilities for Officer, Supervisor, and Administrator.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Capability</TableHead>
              {OFFICER_ROLES.map((role) => (
                <TableHead key={role} className="text-center">
                  {ROLE_LABELS[role]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {CAPABILITIES.map((capability) => (
              <TableRow key={capability}>
                <TableCell className="font-medium">{CAPABILITY_LABELS[capability]}</TableCell>
                {OFFICER_ROLES.map((role) => (
                  <TableCell key={role} className="text-center">
                    <Checkbox
                      aria-label={`${ROLE_LABELS[role]} ${CAPABILITY_LABELS[capability]}`}
                      checked={draft[role].includes(capability)}
                      onChange={() => toggle(role, capability)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onSave} disabled={updateMutation.isPending}>
          Save matrix
        </Button>
      </CardFooter>
    </Card>
  );
}
