"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Move, Plus, X } from "lucide-react";
import { useMatrixMutations, useSignatoryGroups, useSignatoryMembers } from "../hooks";
import type { SignatoryGroup, SignatoryMember } from "../types";
import { useOrgUsers } from "@/features/organizations/hooks";
import { useSession } from "@/features/auth/hooks/useSession";
import { ApiError } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function memberLabel(member: SignatoryMember) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ");
  return name || member.username || member.userId;
}

function ManageGroupDialog({
  orgId,
  group,
  open,
  onOpenChange,
}: {
  orgId: string;
  group: SignatoryGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { can } = useSession();
  const canManage = can("MANAGE_SIGNATORY_ANY");
  const mutations = useMatrixMutations(orgId);
  const membersQuery = useSignatoryMembers(orgId, group?.id ?? "");
  const users = useOrgUsers(orgId, { page: 0, size: 100 });
  const [ordered, setOrdered] = useState<SignatoryMember[]>([]);
  const [orderInputs, setOrderInputs] = useState<Record<string, string>>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    const list = membersQuery.data ?? [];
    setOrdered(list);
    setOrderInputs(
      Object.fromEntries(list.map((m, i) => [m.id, String(m.order ?? i + 1)])),
    );
  }, [membersQuery.data]);

  const memberUserIds = useMemo(() => new Set(ordered.map((m) => m.userId)), [ordered]);

  const available = useMemo(
    () =>
      (users.data?.content ?? []).filter(
        (user) => user.permissionType === "APPROVE" && !memberUserIds.has(user.id),
      ),
    [users.data?.content, memberUserIds],
  );

  async function run(action: () => Promise<unknown>, ok: string) {
    try {
      await action();
      toast.success(ok);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Action failed.");
    }
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= ordered.length) return;
    setOrdered((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  }

  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    setOrdered((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(dragIndex, 1);
      copy.splice(targetIndex, 0, item);
      return copy;
    });
    setDragIndex(null);
  }

  async function saveOrder() {
    if (!group) return;
    await run(
      () =>
        mutations.reorderMembers.mutateAsync({
          groupId: group.id,
          orderedUserIds: ordered.map((m) => m.userId),
        }),
      "Order saved.",
    );
  }

  async function updateRowOrder(memberId: string) {
    if (!group) return;
    const desired = Number(orderInputs[memberId]);
    if (!Number.isFinite(desired) || desired < 1) {
      toast.error("Enter a valid approval order (>= 1).");
      return;
    }
    const currentIndex = ordered.findIndex((m) => m.id === memberId);
    if (currentIndex < 0) return;
    const targetIndex = Math.min(Math.max(desired - 1, 0), ordered.length - 1);
    if (currentIndex === targetIndex) {
      toast.message("Order unchanged.");
      return;
    }
    const next = [...ordered];
    const [item] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, item);
    setOrdered(next);
    await run(
      () =>
        mutations.reorderMembers.mutateAsync({
          groupId: group.id,
          orderedUserIds: next.map((m) => m.userId),
        }),
      "Order updated.",
    );
  }

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage group: {group.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Manage members inside groups</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Available users</p>
                {!available.length ? (
                  <p className="text-sm text-muted-foreground">
                    No users with APPROVE permission left to add, or they are already in this group.
                  </p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto">
                    {available.map((user) => (
                      <li
                        key={user.id}
                        className="flex items-center justify-between gap-2 rounded-md border px-2 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                              user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email ?? user.username}</p>
                        </div>
                        {canManage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              run(
                                () =>
                                  mutations.addMember.mutateAsync({
                                    groupId: group.id,
                                    userId: user.id,
                                  }),
                                "Member added successfully.",
                              )
                            }
                          >
                            Add
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-lg border p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Move className="size-3.5" />
                  Selected members (drag to reorder)
                </p>
                {!ordered.length ? (
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto">
                    {ordered.map((member, index) => (
                      <li
                        key={member.id}
                        draggable={canManage}
                        onDragStart={() => setDragIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDrop(index)}
                        className="flex items-center gap-2 rounded-md border bg-background px-2 py-2"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{memberLabel(member)}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.username ?? member.userId}
                          </p>
                        </div>
                        {canManage && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive"
                            aria-label="Remove member"
                            onClick={() =>
                              run(
                                () =>
                                  mutations.removeMember.mutateAsync({
                                    groupId: group.id,
                                    memberId: member.id,
                                  }),
                                "Member removed.",
                              )
                            }
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Approval hierarchy</h3>
              {canManage && ordered.length > 1 && (
                <Button size="sm" onClick={() => void saveOrder()}>
                  Save reordered list
                </Button>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-sky-50/80 hover:bg-sky-50/80">
                    <TableHead className="w-24">Move</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead className="w-36">Approval Order</TableHead>
                    <TableHead className="w-28">Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordered.map((member, index) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            disabled={!canManage || index === 0}
                            onClick={() => move(index, -1)}
                            aria-label="Move up"
                          >
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            disabled={!canManage || index === ordered.length - 1}
                            onClick={() => move(index, 1)}
                            aria-label="Move down"
                          >
                            <ArrowDown className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{memberLabel(member)}</TableCell>
                      <TableCell>
                        <Input
                          className="h-8 w-20"
                          value={orderInputs[member.id] ?? String(index + 1)}
                          disabled={!canManage}
                          onChange={(e) =>
                            setOrderInputs((prev) => ({ ...prev, [member.id]: e.target.value }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {canManage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void updateRowOrder(member.id)}
                          >
                            Update
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Manage amount-based approval rules under Approval rules in the sidebar.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SignatoryGroupsPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const canManage = can("MANAGE_SIGNATORY_ANY");
  const groups = useSignatoryGroups(orgId);
  const mutations = useMatrixMutations(orgId);
  const [name, setName] = useState("");
  const [managing, setManaging] = useState<SignatoryGroup | null>(null);

  async function run(action: () => Promise<unknown>, ok: string) {
    try {
      await action();
      toast.success(ok);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Action failed.");
    }
  }

  if (groups.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (groups.isError) return <ErrorState onRetry={() => groups.refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Signatory groups</h2>
          <p className="text-sm text-muted-foreground">
            Create groups of APPROVE users and set their approval order.
          </p>
        </div>
      </div>

      {canManage && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="space-y-1 sm:max-w-xs">
            <Label htmlFor="group-name">New group</Label>
            <Input
              id="group-name"
              placeholder="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button
            onClick={() =>
              run(async () => {
                await mutations.createGroup.mutateAsync({ name });
                setName("");
              }, "Group created.")
            }
            disabled={!name.trim()}
          >
            <Plus className="size-4" />
            Create group
          </Button>
        </div>
      )}

      {!groups.data?.length ? (
        <EmptyState title="No groups" description="Create a signatory group to get started." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-sky-50/80 hover:bg-sky-50/80">
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-56">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.data.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>
                    {group.status ? <StatusBadge status={group.status} /> : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setManaging(group)}>
                        Manage
                      </Button>
                      {canManage && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            run(
                              () =>
                                mutations.setGroupActive.mutateAsync({
                                  groupId: group.id,
                                  active: group.status !== "ACTIVE",
                                }),
                              "Group updated.",
                            )
                          }
                        >
                          {group.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ManageGroupDialog
        orgId={orgId}
        group={managing}
        open={Boolean(managing)}
        onOpenChange={(open) => !open && setManaging(null)}
      />
    </div>
  );
}
