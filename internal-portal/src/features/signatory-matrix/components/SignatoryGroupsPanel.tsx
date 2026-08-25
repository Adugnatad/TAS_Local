"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMatrixMutations, useSignatoryGroups, useSignatoryMembers } from "../hooks";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SignatoryGroupsPanel({ orgId }: { orgId: string }) {
  const { can } = useSession();
  const canManage = can("MANAGE_SIGNATORY_ANY");
  const groups = useSignatoryGroups(orgId);
  const mutations = useMatrixMutations(orgId);
  const [name, setName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const members = useSignatoryMembers(orgId, selectedGroupId);
  const users = useOrgUsers(orgId, { page: 0, size: 100 });
  const [userId, setUserId] = useState("");

  const approvers =
    users.data?.content.filter((user) => user.permissionType === "APPROVE") ?? [];

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
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Groups</h2>
        {!groups.data?.length ? (
          <EmptyState title="No groups" />
        ) : (
          <ul className="space-y-2">
            {groups.data.map((group) => (
              <li key={group.id} className="rounded-md border p-3">
                <button
                  type="button"
                  className="text-left font-medium hover:underline"
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  {group.name}
                </button>
                {group.status && <StatusBadge status={group.status} className="ml-2" />}
                {canManage && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
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
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManage && (
          <div className="flex gap-2">
            <Input
              placeholder="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              onClick={() =>
                run(async () => {
                  await mutations.createGroup.mutateAsync({ name });
                  setName("");
                }, "Group created.")
              }
              disabled={!name}
            >
              Create
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Members</h2>
        {!selectedGroupId ? (
          <p className="text-sm text-muted-foreground">Select a group.</p>
        ) : members.isError ? (
          <ErrorState onRetry={() => members.refetch()} />
        ) : (
          <ul className="space-y-2">
            {(members.data ?? []).map((member, index) => (
              <li key={member.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>
                  {index + 1}. {member.firstName ?? member.username ?? member.userId}
                </span>
                {canManage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      run(
                        () =>
                          mutations.removeMember.mutateAsync({
                            groupId: selectedGroupId,
                            memberId: member.id,
                          }),
                        "Member removed.",
                      )
                    }
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManage && selectedGroupId && (
          <div className="space-y-2">
            <Label>Add APPROVE user</Label>
            <Select value={userId} onValueChange={(value) => value && setUserId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {approvers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() =>
                run(
                  () => mutations.addMember.mutateAsync({ groupId: selectedGroupId, userId }),
                  "Member added.",
                )
              }
              disabled={!userId}
            >
              Add member
            </Button>
            {(members.data?.length ?? 0) > 1 && (
              <Button
                variant="outline"
                onClick={() =>
                  run(
                    () =>
                      mutations.reorderMembers.mutateAsync({
                        groupId: selectedGroupId,
                        orderedUserIds: members.data?.map((m) => m.userId) ?? [],
                      }),
                    "Order saved.",
                  )
                }
              >
                Save current order
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
