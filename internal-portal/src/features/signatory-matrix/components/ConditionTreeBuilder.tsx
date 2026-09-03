"use client";

import { Plus, Trash2 } from "lucide-react";
import type { SignatoryGroup } from "../types";
import type { ConditionBuilderState, GroupLeaf, OrBranchState } from "../utils/condition-tree";
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

export function ConditionTreeBuilder({
  groups,
  state,
  onChange,
  disabled,
}: {
  groups: SignatoryGroup[];
  state: ConditionBuilderState;
  onChange: (state: ConditionBuilderState) => void;
  disabled?: boolean;
}) {
  function updateBranch(index: number, branch: OrBranchState) {
    const orBranches = [...state.orBranches];
    orBranches[index] = branch;
    onChange({ ...state, orBranches });
  }

  function addOrBranch() {
    onChange({
      ...state,
      orBranches: [
        ...state.orBranches,
        { kind: "single", leaf: { groupId: "", minApprovals: 1 } },
      ],
    });
  }

  function removeOrBranch(index: number) {
    onChange({
      ...state,
      orBranches: state.orBranches.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={state.mode === "advanced"}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              ...state,
              mode: e.target.checked ? "advanced" : "simple",
            })
          }
        />
        <Label>Advanced condition tree (OR of AND groups)</Label>
      </div>

      {state.mode === "simple" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Signatory group</Label>
            <Select
              value={state.simpleGroupId || undefined}
              disabled={disabled}
              onValueChange={(value) =>
                value &&
                onChange({
                  ...state,
                  simpleGroupId: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Min approvals</Label>
            <Input
              type="number"
              min={1}
              disabled={disabled}
              value={state.simpleMinApprovals}
              onChange={(e) =>
                onChange({
                  ...state,
                  simpleMinApprovals: Number(e.target.value) || 1,
                })
              }
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {state.orBranches.map((branch, branchIndex) => (
            <div key={branchIndex} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Alternative {branchIndex + 1}</Label>
                {state.orBranches.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    onClick={() => removeOrBranch(branchIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={branch.kind === "and"}
                  disabled={disabled}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const leaf =
                        branch.kind === "single"
                          ? branch.leaf
                          : { groupId: "", minApprovals: 1 };
                      updateBranch(branchIndex, { kind: "and", leaves: [leaf] });
                    } else {
                      const leaf =
                        branch.kind === "and" && branch.leaves[0]
                          ? branch.leaves[0]
                          : { groupId: "", minApprovals: 1 };
                      updateBranch(branchIndex, { kind: "single", leaf });
                    }
                  }}
                />
                <Label>Require multiple groups (AND)</Label>
              </div>
              {branch.kind === "single" ? (
                <GroupLeafRow
                  groups={groups}
                  leaf={branch.leaf}
                  disabled={disabled}
                  onChange={(leaf) => updateBranch(branchIndex, { kind: "single", leaf })}
                />
              ) : (
                <div className="space-y-2">
                  {branch.leaves.map((leaf, leafIndex) => (
                    <div key={leafIndex} className="flex items-start gap-2">
                      <GroupLeafRow
                        groups={groups}
                        leaf={leaf}
                        disabled={disabled}
                        onChange={(updated) => {
                          const leaves = [...branch.leaves];
                          leaves[leafIndex] = updated;
                          updateBranch(branchIndex, { kind: "and", leaves });
                        }}
                      />
                      {branch.leaves.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={disabled}
                          onClick={() => {
                            const leaves = branch.leaves.filter((_, i) => i !== leafIndex);
                            updateBranch(branchIndex, { kind: "and", leaves });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() =>
                      updateBranch(branchIndex, {
                        kind: "and",
                        leaves: [...branch.leaves, { groupId: "", minApprovals: 1 }],
                      })
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add group to AND
                  </Button>
                </div>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addOrBranch}>
            <Plus className="mr-1 h-4 w-4" />
            Add OR alternative
          </Button>
        </div>
      )}
    </div>
  );
}

function GroupLeafRow({
  groups,
  leaf,
  onChange,
  disabled,
}: {
  groups: SignatoryGroup[];
  leaf: GroupLeaf;
  onChange: (leaf: GroupLeaf) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Select
        value={leaf.groupId || undefined}
        disabled={disabled}
        onValueChange={(value) => value && onChange({ ...leaf, groupId: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select group" />
        </SelectTrigger>
        <SelectContent>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={1}
        disabled={disabled}
        placeholder="Min approvals"
        value={leaf.minApprovals}
        onChange={(e) => onChange({ ...leaf, minApprovals: Number(e.target.value) || 1 })}
      />
    </div>
  );
}
