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
    await page.goto("/signatory-matrix/cust-003/signatories");
    await page.getByRole("button", { name: "Add Signatory" }).click();
    await page.getByLabel("Full Name").fill("Test Signatory");
    await page.getByLabel("Role").click();
    await page.getByRole("option", { name: "Treasurer" }).click();
    await page.getByLabel("Signature Limit (PHP)").fill("2000000");
    await page.getByRole("dialog").getByRole("button", { name: "Add Signatory" }).click();
    await expect(page.getByText("Test Signatory")).toBeVisible();
    await page.goto("/signatory-matrix/cust-003/preview");
    await page.getByLabel("Request amount (PHP)").fill("1500000");
    await page.getByRole("button", { name: "Preview combinations" }).click();
    await expect(page.getByText(/valid signatory combination/i)).toBeVisible();
  });
});

test.describe("Profile and settings", () => {
  test("officer can save profile", async ({ page }) => {
    await loginAs(page, "Officer");
    await page.goto("/profile");
    await page.getByLabel("Display name").fill("Maria Santos Updated");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile saved.")).toBeVisible();
  });

  test("admin can open role settings", async ({ page }) => {
    await loginAs(page, "Administrator");
    await page.goto("/settings/signatory");
    await expect(page.getByRole("heading", { name: "Signatory titles" })).toBeVisible();
    await page.getByRole("link", { name: "Roles" }).click();
    await expect(page.getByText("Portal role permissions")).toBeVisible();
  });

  test("admin can manage portal users", async ({ page }) => {
    await loginAs(page, "Administrator");
    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByText("Ana Reyes")).toBeVisible();
    await page.getByRole("button", { name: "Add user" }).click();
    await page.getByLabel("Full name").fill("Test Officer");
    await page.getByLabel("Email").fill("test.officer@coopbank.local");
    await page.getByLabel("Portal role").click();
    await page.getByRole("option", { name: "Officer" }).click();
    await page.getByRole("button", { name: "Create user" }).click();
    await expect(page.getByText("User created.")).toBeVisible();
    await expect(page.getByText("Test Officer")).toBeVisible();
  });

  test("officer cannot open user management", async ({ page }) => {
    await loginAs(page, "Officer");
    await page.goto("/users");
    await expect(page.getByText("Not authorized")).toBeVisible();
  });
});
