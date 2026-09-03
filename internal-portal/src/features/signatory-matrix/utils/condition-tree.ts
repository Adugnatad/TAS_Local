import type { ConditionTreeNode } from "../types";

export interface GroupLeaf {
  groupId: string;
  minApprovals: number;
}

export interface OrBranch {
  kind: "single";
  leaf: GroupLeaf;
}

export interface OrBranchAnd {
  kind: "and";
  leaves: GroupLeaf[];
}

export type OrBranchState = OrBranch | OrBranchAnd;

export interface ConditionBuilderState {
  mode: "simple" | "advanced";
  simpleGroupId: string;
  simpleMinApprovals: number;
  orBranches: OrBranchState[];
}

export function defaultBuilderState(): ConditionBuilderState {
  return {
    mode: "simple",
    simpleGroupId: "",
    simpleMinApprovals: 1,
    orBranches: [{ kind: "single", leaf: { groupId: "", minApprovals: 1 } }],
  };
}

export function parseConditionTree(
  rule: {
    signatoryGroupId?: string;
    conditionTree?: ConditionTreeNode | null;
  },
): ConditionBuilderState {
  if (rule.conditionTree) {
    return parseTreeToState(rule.conditionTree);
  }
  if (rule.signatoryGroupId) {
    return {
      mode: "simple",
      simpleGroupId: rule.signatoryGroupId,
      simpleMinApprovals: 1,
      orBranches: [{ kind: "single", leaf: { groupId: rule.signatoryGroupId, minApprovals: 1 } }],
    };
  }
  return defaultBuilderState();
}

function parseTreeToState(tree: ConditionTreeNode): ConditionBuilderState {
  if (tree.type === "GROUP") {
    return {
      mode: "simple",
      simpleGroupId: tree.groupId,
      simpleMinApprovals: tree.minApprovals,
      orBranches: [
        { kind: "single", leaf: { groupId: tree.groupId, minApprovals: tree.minApprovals } },
      ],
    };
  }
  if (tree.type === "OR") {
    const orBranches: OrBranchState[] = tree.children.map((child) => {
      if (child.type === "GROUP") {
        return { kind: "single", leaf: { groupId: child.groupId, minApprovals: child.minApprovals } };
      }
      if (child.type === "AND") {
        return {
          kind: "and",
          leaves: child.children
            .filter((c) => c.type === "GROUP")
            .map((c) => ({
              groupId: (c as { type: "GROUP"; groupId: string; minApprovals: number }).groupId,
              minApprovals: (c as { type: "GROUP"; groupId: string; minApprovals: number })
                .minApprovals,
            })),
        };
      }
      return { kind: "single", leaf: { groupId: "", minApprovals: 1 } };
    });
    return {
      mode: "advanced",
      simpleGroupId: "",
      simpleMinApprovals: 1,
      orBranches: orBranches.length ? orBranches : defaultBuilderState().orBranches,
    };
  }
  if (tree.type === "AND") {
    const leaves = tree.children
      .filter((c) => c.type === "GROUP")
      .map((c) => ({
        groupId: (c as { type: "GROUP"; groupId: string; minApprovals: number }).groupId,
        minApprovals: (c as { type: "GROUP"; groupId: string; minApprovals: number }).minApprovals,
      }));
    return {
      mode: "advanced",
      simpleGroupId: "",
      simpleMinApprovals: 1,
      orBranches: [{ kind: "and", leaves }],
    };
  }
  return defaultBuilderState();
}

export function serializeBuilderState(state: ConditionBuilderState): {
  signatoryGroupId?: string;
  conditionTree?: ConditionTreeNode | null;
} {
  if (state.mode === "simple" && state.simpleGroupId) {
    if (state.simpleMinApprovals <= 1) {
      return { signatoryGroupId: state.simpleGroupId };
    }
    return {
      conditionTree: {
        type: "GROUP",
        groupId: state.simpleGroupId,
        minApprovals: state.simpleMinApprovals,
      },
    };
  }

  const children = state.orBranches
    .map((branch): ConditionTreeNode | null => {
      if (branch.kind === "single" && branch.leaf.groupId) {
        return {
          type: "GROUP",
          groupId: branch.leaf.groupId,
          minApprovals: branch.leaf.minApprovals,
        };
      }
      if (branch.kind === "and" && branch.leaves.some((l) => l.groupId)) {
        return {
          type: "AND",
          children: branch.leaves
            .filter((l) => l.groupId)
            .map((l) => ({
              type: "GROUP" as const,
              groupId: l.groupId,
              minApprovals: l.minApprovals,
            })),
        };
      }
      return null;
    })
    .filter((node) => node !== null) as ConditionTreeNode[];

  if (!children.length) {
    return { conditionTree: null };
  }
  if (children.length === 1) {
    return { conditionTree: children[0] };
  }
  return { conditionTree: { type: "OR", children } };
}
