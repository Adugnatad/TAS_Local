import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, role: "Officer" | "Supervisor" | "Administrator") {
  await page.goto("/login");
  await page.waitForFunction(() => document.body.dataset.appReady === "true");
  await page.getByRole("button", { name: "Sign In" }).waitFor();

  await page.getByLabel("Select role").click();
  await page.getByRole("option", { name: role }).click();

  const loginResponse = page.waitForResponse(
    (resp) => resp.url().includes("/api/auth/login") && resp.status() === 200,
  );
  await page.getByRole("button", { name: "Sign In" }).click();
  await loginResponse;

  await expect(page).toHaveURL("/status", { timeout: 15_000 });
}

test.describe("Status Viewer", () => {
  test("login and view status list", async ({ page }) => {
    await loginAs(page, "Officer");
    await expect(page.getByRole("heading", { name: "CRM Status Viewer" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("link", { name: /^req-/ }).first()).toBeVisible();
  });

  test("view status detail", async ({ page }) => {
    await loginAs(page, "Officer");
    await page.goto("/status/req-001");
    await expect(page.getByText("Request Progress")).toBeVisible();
    await expect(page.getByLabel("Breadcrumb").getByText("req-001")).toBeVisible();
  });
});

test.describe("Onboarding", () => {
  test("admin can approve customer onboarding", async ({ page }) => {
    await loginAs(page, "Administrator");
    await page.goto("/onboarding/cust-002");
    await expect(page.getByRole("button", { name: "Approve Onboarding" })).toBeVisible();
    await page.getByRole("button", { name: "Approve Onboarding" }).click();
    await expect(page.getByText("Status updated to Approved.")).toBeVisible();
  });
});

test.describe("Signatory Matrix", () => {
  test("add signatory and preview matrix", async ({ page }) => {
    await loginAs(page, "Officer");
    await page.goto("/signatory-matrix/cust-003");
    await page.getByRole("button", { name: "Add Signatory" }).click();
    await page.getByLabel("Full Name").fill("Test Signatory");
    await page.getByLabel("Role").fill("Treasurer");
    await page.getByLabel("Signature Limit (PHP)").fill("2000000");
    await page.getByRole("dialog").getByRole("button", { name: "Add Signatory" }).click();
    await expect(page.getByText("Test Signatory")).toBeVisible();
    await page.getByRole("tab", { name: "Matrix Preview" }).click();
    await page.getByPlaceholder("Amount in PHP").fill("1500000");
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.getByText(/valid signatory combination/i)).toBeVisible();
  });
});
