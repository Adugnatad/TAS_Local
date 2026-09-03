import { describe, expect, it } from "vitest";
import {
  defaultBuilderState,
  parseConditionTree,
  serializeBuilderState,
} from "@/features/signatory-matrix/utils/condition-tree";

describe("condition-tree utils", () => {
  it("serializes simple mode to signatoryGroupId", () => {
    const state = {
      ...defaultBuilderState(),
      simpleGroupId: "group-a",
      simpleMinApprovals: 1,
    };
    expect(serializeBuilderState(state)).toEqual({ signatoryGroupId: "group-a" });
  });

  it("serializes simple mode with min approvals to GROUP tree", () => {
    const state = {
      ...defaultBuilderState(),
      simpleGroupId: "group-a",
      simpleMinApprovals: 2,
    };
    expect(serializeBuilderState(state)).toEqual({
      conditionTree: { type: "GROUP", groupId: "group-a", minApprovals: 2 },
    });
  });

  it("serializes OR of AND branches", () => {
    const state = {
      mode: "advanced" as const,
      simpleGroupId: "",
      simpleMinApprovals: 1,
      orBranches: [
        {
          kind: "and" as const,
          leaves: [
            { groupId: "a", minApprovals: 1 },
            { groupId: "b", minApprovals: 2 },
          ],
        },
        { kind: "single" as const, leaf: { groupId: "c", minApprovals: 1 } },
      ],
    };
    expect(serializeBuilderState(state)).toEqual({
      conditionTree: {
        type: "OR",
        children: [
          {
            type: "AND",
            children: [
              { type: "GROUP", groupId: "a", minApprovals: 1 },
              { type: "GROUP", groupId: "b", minApprovals: 2 },
            ],
          },
          { type: "GROUP", groupId: "c", minApprovals: 1 },
        ],
      },
    });
  });

  it("parses condition tree back to advanced state", () => {
    const parsed = parseConditionTree({
      conditionTree: {
        type: "OR",
        children: [
          {
            type: "AND",
            children: [
              { type: "GROUP", groupId: "a", minApprovals: 1 },
              { type: "GROUP", groupId: "b", minApprovals: 2 },
            ],
          },
        ],
      },
    });
    expect(parsed.mode).toBe("advanced");
    expect(parsed.orBranches[0].kind).toBe("and");
  });
});
