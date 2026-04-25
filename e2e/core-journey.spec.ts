import { test, expect, Page } from "@playwright/test";
import { mockApiProfile } from "./helpers/mockAuth";

const SUPABASE_URL = "https://kypejbzdjfwdyzxfqgx.supabase.co";

const FAKE_USER = {
  id: "journey-user-id",
  email: "journeytest@reckon.app",
  user_metadata: { full_name: "Journey Tester" },
  app_metadata: {},
  aud: "authenticated",
  role: "authenticated",
  created_at: new Date().toISOString(),
};

const FAKE_SESSION = {
  access_token: "fake-access-token-journey",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "fake-refresh-token-journey",
  user: FAKE_USER,
};

const JOURNEY_JOB_ID = "journey-job-1";

const JOB_NO_SCORE = {
  id: JOURNEY_JOB_ID,
  job_title: "Full Stack Engineer",
  company_name: "Journey Corp",
  status: "saved",
  match_score: null,
  job_description: "We need a Full Stack Engineer with React and Node.js experience.",
  missing_skills: null,
  resume_suggestions: null,
  generated_email: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const JOB_WITH_SCORE = {
  ...JOB_NO_SCORE,
  // 65% → ATS Risk "Medium" (40 <= score < 70)
  match_score: 65,
  missing_skills: [{ skill: "Docker" }, { skill: "Redis" }],
  resume_suggestions: ["Add Node.js project metrics", "Emphasise React component architecture"],
  generated_email:
    "Dear Hiring Manager,\n\nI am delighted to apply for the Full Stack Engineer role at Journey Corp.",
};

/** Inject the fake Supabase session into localStorage so ProtectedRoute passes. */
async function injectSession(page: Page) {
  const storageKey = "sb-kypejbzdjfwdyzxfqgx-auth-token";
  await page.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: storageKey, session: FAKE_SESSION }
  );
}

/** Mock Supabase REST endpoints so the Supabase SDK accepts the fake session. */
async function mockSupabase(page: Page) {
  await page.route(`${SUPABASE_URL}/**`, (route) => {
    const url = route.request().url();
    if (url.includes("/auth/v1/user")) {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FAKE_USER) });
    } else {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session: FAKE_SESSION, user: FAKE_USER }),
      });
    }
  });
}

/** Mock Supabase signUp endpoint plus all other Supabase routes. */
async function mockSignupAuth(page: Page) {
  await page.route(`${SUPABASE_URL}/**`, async (route) => {
    const url = route.request().url();
    if (url.includes("/auth/v1/signup")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FAKE_SESSION) });
    } else if (url.includes("/auth/v1/user")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FAKE_USER) });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session: FAKE_SESSION, user: FAKE_USER }),
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Full End-to-End Journey (Sign Up → Add Job → Analysis → Score)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Core User Journey — Sign Up → Add Job → AI Analysis → Match Score", () => {
  test("full journey: sign up, add a job manually, run analysis, see match score", async ({ page }) => {
    // ── Mock all APIs before any navigation ──────────────────────────────────

    await mockSignupAuth(page);
    await mockApiProfile(page);

    // Jobs list: empty on dashboard
    await page.route("/api/jobs", (route) => {
      if (route.request().method() === "GET") {
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobs: [] }) });
      } else if (route.request().method() === "POST") {
        route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ job: JOB_NO_SCORE }) });
      } else {
        route.continue();
      }
    });

    // Job detail: no score until after explicit analysis click on the detail page
    let jobAnalyzed = false;
    await page.route(`/api/jobs/${JOURNEY_JOB_ID}`, (route) => {
      if (route.request().method() === "GET") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ job: jobAnalyzed ? JOB_WITH_SCORE : JOB_NO_SCORE }),
        });
      } else {
        route.continue();
      }
    });

    // Silently absorb the automatic analyze call that the modal fires after job creation
    // so it does NOT flip jobAnalyzed to true prematurely
    await page.route(`/api/jobs/${JOURNEY_JOB_ID}/analyze`, (route) => {
      // Only flip the flag on the second call (from the job-detail page button)
      if (jobAnalyzed) {
        // Already analyzed; just return OK
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      } else {
        // First automatic call from modal — absorb silently, don't flip the flag yet
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      }
    });

    // ── Sign up ──────────────────────────────────────────────────────────────

    await page.goto("/signup");
    await expect(page.getByLabel("Full Name")).toBeVisible();

    await page.getByLabel("Full Name").fill("Journey Tester");
    await page.getByLabel("Email Address").fill("journeytest@reckon.app");
    await page.getByLabel("Password").fill("securepassword123");
    await page.getByRole("button", { name: "Sign Up" }).click();

    // ── Assert redirect to dashboard ─────────────────────────────────────────

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // ── Open Add Job modal and submit manual entry ────────────────────────────

    await page.getByRole("button", { name: "Add Job" }).click();
    await expect(page.getByText("Add New Job", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Manual" }).click();
    await expect(page.getByLabel("Company")).toBeVisible();

    await page.getByLabel("Company").fill("Journey Corp");
    await page.getByLabel("Job Title").fill("Full Stack Engineer");
    await page.locator('[role="dialog"]').getByRole("button", { name: "Add Job" }).click();

    // ── Verify navigation to job detail page ─────────────────────────────────

    await expect(page).toHaveURL(/\/jobs\/journey-job-1/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { level: 1 }).filter({ hasText: "Full Stack Engineer" })
    ).toBeVisible({ timeout: 8000 });
    await expect(
      page.locator("div.text-sm.text-muted-foreground").filter({ hasText: "Journey Corp" }).first()
    ).toBeVisible();

    // ── Before explicit analysis: score shows "--" and Analyze Job is visible ─

    await expect(page.getByText("--")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "Analyze Job" }).first()).toBeVisible();

    // ── Trigger AI analysis from the job detail page ──────────────────────────

    // Now flip the flag so the next GET returns the analyzed job
    jobAnalyzed = true;
    await page.getByRole("button", { name: "Analyze Job" }).first().click();

    // ── Assert match score appears ─────────────────────────────────────────

    await expect(page.getByText("Analysis complete", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("65%")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("ATS Risk Score", { exact: true })).toBeVisible();
    await expect(page.getByText("Medium", { exact: true })).toBeVisible();
    await expect(page.getByText("Docker", { exact: true })).toBeVisible();
    await expect(page.getByText("Redis", { exact: true })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Sign Up redirects to dashboard
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Core User Journey — Sign Up Flow", () => {
  test("signup form submits and redirects to dashboard", async ({ page }) => {
    await mockSignupAuth(page);
    await mockApiProfile(page);
    await page.route("/api/jobs", (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobs: [] }) });
    });

    await page.goto("/signup");
    await page.getByLabel("Full Name").fill("Journey Tester");
    await page.getByLabel("Email Address").fill("journeytest@reckon.app");
    await page.getByLabel("Password").fill("securepassword123");
    await page.getByRole("button", { name: "Sign Up" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Dashboard header rendered (profile mock returns full_name "Test User")
    await expect(page.getByText("Welcome, Test")).toBeVisible({ timeout: 8000 });
    // Five Kanban columns
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
    await expect(page.getByText("Applied", { exact: true })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Add job manually, navigate to detail, score already present
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Core User Journey — Add Job and Navigate to Detail", () => {
  test("adds a job manually and navigates to job detail page showing match score", async ({ page }) => {
    await injectSession(page);
    await mockSupabase(page);
    await mockApiProfile(page);

    await page.route("/api/jobs", (route) => {
      if (route.request().method() === "GET") {
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobs: [] }) });
      } else {
        route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ job: JOB_WITH_SCORE }) });
      }
    });

    await page.route(`/api/jobs/${JOURNEY_JOB_ID}`, (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ job: JOB_WITH_SCORE }) });
    });

    // Absorb any automatic analyze call from the modal
    await page.route(`/api/jobs/${JOURNEY_JOB_ID}/analyze`, (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Add Job" }).click();
    await expect(page.getByText("Add New Job", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Manual" }).click();
    await page.getByLabel("Company").fill("Journey Corp");
    await page.getByLabel("Job Title").fill("Full Stack Engineer");
    await page.locator('[role="dialog"]').getByRole("button", { name: "Add Job" }).click();

    await expect(page).toHaveURL(/\/jobs\/journey-job-1/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Score from mock (65%) is visible
    await expect(page.getByText("65%")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Match Score")).toBeVisible();
    await expect(page.getByText("Missing Skills", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Docker", { exact: true })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Match score display — "--" before analysis, score after
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Core User Journey — Match Score Display", () => {
  test("shows '--' before analysis and numeric score after analysis", async ({ page }) => {
    await injectSession(page);
    await mockSupabase(page);
    await mockApiProfile(page);

    let analyzed = false;
    await page.route(`/api/jobs/${JOURNEY_JOB_ID}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ job: analyzed ? JOB_WITH_SCORE : JOB_NO_SCORE }),
      });
    });

    await page.route(`/api/jobs/${JOURNEY_JOB_ID}/analyze`, (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });

    // Navigate directly to job detail (pre-authenticated via localStorage)
    await page.goto(`/jobs/${JOURNEY_JOB_ID}`);
    await page.waitForLoadState("networkidle");

    // Before analysis: "--" and the Analyze Job button
    await expect(page.getByText("--")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "Analyze Job" }).first()).toBeVisible();

    // Flip the flag so the subsequent GET returns the analyzed job
    analyzed = true;
    await page.getByRole("button", { name: "Analyze Job" }).first().click();

    await expect(page.getByText("Analysis complete", { exact: true })).toBeVisible({ timeout: 10000 });

    // After analysis: numeric score shown (65% → Medium ATS risk)
    await expect(page.getByText("65%")).toBeVisible({ timeout: 8000 });
    // 65% is in 40–69 range → "Medium" ATS risk
    await expect(page.getByText("Medium", { exact: true })).toBeVisible();
    await expect(page.getByText("Docker", { exact: true })).toBeVisible();
    await expect(page.getByText("Redis", { exact: true })).toBeVisible();
  });
});
