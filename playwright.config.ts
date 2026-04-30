import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests against https://www.imdb.com (live site).
 * Requires network. Run: npm run playwright:install, then npm run test:e2e
 */
export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [["html", { open: "never" }], ["list"]],
    timeout: 60_000,
    expect: { timeout: 15_000 },
    use: {
        baseURL: "https://www.imdb.com",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "on-first-retry",
        navigationTimeout: 60_000,
        locale: "en-US",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
