import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

describe("onboarding validation APIs", () => {
  it("sends the TIN to the external validation API", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true, message: "TIN verified" }),
    });

    await expect(
      apiClient("/customers/validate-tin", {
        method: "POST",
        body: { tin: "1234567890" },
      }),
    ).resolves.toEqual({ valid: true, message: "TIN verified" });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/customers/validate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tin: "1234567890" }),
    });
  });

  it("sends business license metadata to the external validation API", async () => {
    const businessLicense = { name: "license.pdf", size: 1024, type: "application/pdf" };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ valid: false, message: "License expired" }),
    });

    await expect(
      apiClient("/customers/validate-business-license", {
        method: "POST",
        body: { businessLicense },
      }),
    ).resolves.toEqual({ valid: false, message: "License expired" });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/customers/validate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessLicense }),
    });
  });
});
