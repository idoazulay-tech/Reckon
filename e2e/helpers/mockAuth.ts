import { Page } from "@playwright/test";

const FAKE_USER = {
  id: "test-user-id",
  email: "test@reckon.app",
  user_metadata: { full_name: "Test User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
  role: "authenticated",
};

const FUTURE_TIMESTAMP = Math.floor(Date.now() / 1000) + 86400;

const FAKE_SESSION = {
  access_token: "fake-access-token-valid",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: FUTURE_TIMESTAMP,
  refresh_token: "fake-refresh-token",
  user: FAKE_USER,
};

export async function mockAuth(page: Page): Promise<void> {
  const supabaseUrl = "https://kypejbzdjfwdyzxfqgx.supabase.co";
  const storageKey = "sb-kypejbzdjfwdyzxfqgx-auth-token";

  await page.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: storageKey, session: FAKE_SESSION }
  );

  await page.route(`${supabaseUrl}/**`, (route) => {
    const url = route.request().url();
    if (url.includes("/auth/v1/user")) {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_USER),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session: FAKE_SESSION, user: FAKE_USER }),
      });
    }
  });
}

export async function mockApiJobs(page: Page): Promise<void> {
  await page.route("/api/jobs", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        jobs: [
          {
            id: "job-1",
            job_title: "Senior Frontend Engineer",
            company_name: "Acme Corp",
            status: "applied",
            match_score: 82,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "job-2",
            job_title: "React Developer",
            company_name: "Beta Inc",
            status: "interview",
            match_score: 67,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      }),
    });
  });
}

export async function mockApiProfile(page: Page): Promise<void> {
  await page.route("/api/profile", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        profile: {
          id: "test-user-id",
          full_name: "Test User",
          subscription_type: "free",
          jobs_count: 2,
          resume_url: null,
          resume_text: null,
        },
      }),
    });
  });
}

export async function mockApiBilling(page: Page): Promise<void> {
  await page.route("/api/billing/status", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        subscription_type: "free",
        jobs_count: 2,
        today_ai_calls: 0,
        amount_owed: 0,
        limits: {
          free_jobs: 3,
          daily_ai_analyses: 10,
        },
      }),
    });
  });
}
