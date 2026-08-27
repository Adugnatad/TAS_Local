import { describe, expect, it } from "vitest";
import { hasAnyPermission, hasPermission } from "@/lib/permissions";

describe("hasPermission", () => {
  it("returns true when the code is granted", () => {
    expect(hasPermission(["VIEW_ORGANIZATIONS"], "VIEW_ORGANIZATIONS")).toBe(true);
  });

  it("returns false when missing", () => {
    expect(hasPermission(["VIEW_ORGANIZATIONS"], "MANAGE_EMPLOYEES")).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("matches any listed code", () => {
    expect(
      hasAnyPermission(["VIEW_ORGANIZATIONS"], ["MANAGE_EMPLOYEES", "VIEW_ORGANIZATIONS"]),
    ).toBe(true);
  });
});
