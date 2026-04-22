import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders login form elements", async ({ page }) => {
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("stays on login page when invalid email submitted", async ({ page }) => {
    await page.getByLabel("Email Address").fill("notanemail");
    await page.getByLabel("Password").fill("somepassword");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows password length validation error", async ({ page }) => {
    await page.getByLabel("Email Address").fill("test@example.com");
    await page.getByLabel("Password").fill("12345");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Password must be at least 6 characters")).toBeVisible();
  });

  test("shows error toast on wrong credentials", async ({ page }) => {
    await page.getByLabel("Email Address").fill("test@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Error signing in", { exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("Sign up link navigates to signup", async ({ page }) => {
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe("Signup Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("renders signup form elements", async ({ page }) => {
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(page.getByText("Name must be at least 2 characters")).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("shows name length validation error", async ({ page }) => {
    await page.getByLabel("Full Name").fill("A");
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(page.getByText("Name must be at least 2 characters")).toBeVisible();
  });

  test("Sign in link navigates to login", async ({ page }) => {
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
