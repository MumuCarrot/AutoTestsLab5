import { test, expect } from "@playwright/test";
import { dismissConsentIfPresent, imdbSearchInput } from "./helpers";

/** Scenario 1 sample query (assignment example: «Interception» — here Inception for a stable hit). */
const SCENARIO_1_QUERY = "Inception";
const SCENARIO_1_TITLE_PATTERN = /Inception/i;

/** Scenario 2: nonsense query that should yield zero title hits. */
const SCENARIO_2_QUERY = "zxcvbnm123";

test.describe("IMDb", () => {
    test("homepage loads and title references IMDb", async ({ page }) => {
        await page.goto("/");
        await dismissConsentIfPresent(page);
        await expect(page).toHaveTitle(/IMDb/i);
    });

    test("movie title page shows expected heading", async ({ page }) => {
        await page.goto("/title/tt0111161/");
        await dismissConsentIfPresent(page);
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
            /The Shawshank Redemption/i,
        );
    });

    test("search finds a known title", async ({ page }) => {
        await page.goto("/");
        await dismissConsentIfPresent(page);

        const search = imdbSearchInput(page);
        await search.fill("Inception 2010");
        await search.press("Enter");

        await expect(page).toHaveURL(/find|title|q=/i, { timeout: 30_000 });
        await expect(page.locator("body")).toContainText(/Inception/i, {
            timeout: 20_000,
        });
    });
});

/**
 * Scenario 1: homepage → type film name → pick from autocomplete → verify title.
 */
test.describe("Scenario 1: IMDb search autocomplete", () => {
    test("dropdown first result matches keyword; opened page title matches keyword", async ({
        page,
    }) => {
        await page.goto("/");
        await dismissConsentIfPresent(page);

        const search = imdbSearchInput(page);
        await search.click();
        await search.pressSequentially(SCENARIO_1_QUERY, { delay: 40 });

        const listbox = page.getByRole("listbox").first();
        await expect(listbox).toBeVisible({ timeout: 20_000 });

        const firstOption = listbox.getByRole("option").first();
        await expect(firstOption).toBeVisible();
        await expect(firstOption).toContainText(SCENARIO_1_TITLE_PATTERN);

        await firstOption.click();

        await expect(page).toHaveURL(/\/title\/tt\d+/i, { timeout: 30_000 });
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
            SCENARIO_1_TITLE_PATTERN,
        );
    });
});

/**
 * Scenario 2: homepage → nonsense search → Enter → empty results page.
 */
test.describe("Scenario 2: IMDb search no results", () => {
    test("shows no results message and no movie result cards", async ({ page }) => {
        await page.goto("/");
        await dismissConsentIfPresent(page);

        const search = imdbSearchInput(page);
        await search.fill(SCENARIO_2_QUERY);
        await search.press("Enter");

        await expect(page).toHaveURL(/find/i, { timeout: 30_000 });

        const noResultsBanner = page
            .getByTestId("results-section-empty-results-msg")
            .first();
        await expect(noResultsBanner).toBeVisible({ timeout: 20_000 });
        await expect(noResultsBanner).toContainText(/No results found for/i);
        await expect(noResultsBanner).toContainText(SCENARIO_2_QUERY);

        const movieCards = page.locator("li.ipc-metadata-list-summary-item");
        await expect(movieCards).toHaveCount(0);
    });
});

/**
 * Scenario 3: Top 250 chart → open first title → verify title page details.
 */
test.describe("Scenario 3: IMDb Top 250 first film", () => {
    test("opens title page with name, rating, and release year", async ({ page }) => {
        await page.goto("/chart/top/");
        await dismissConsentIfPresent(page);

        const firstRow = page.locator("li.ipc-metadata-list-summary-item").first();
        await expect(firstRow).toBeVisible({ timeout: 20_000 });
        const firstFilmLink = firstRow.locator('a.ipc-title-link-wrapper[href*="/title/tt"]').first();
        await firstFilmLink.click();

        await expect(page).toHaveURL(/\/title\/tt\d+/i, { timeout: 30_000 });

        const titleHeading = page.getByRole("heading", { level: 1 });
        await expect(titleHeading).toBeVisible();
        await expect(titleHeading).not.toHaveText(/^\s*$/);

        const ratingScore = page
            .locator('[data-testid="hero-rating-bar__aggregate-rating__score"]')
            .first();
        await expect(ratingScore).toBeVisible();
        await expect(ratingScore).toHaveText(/\d/);

        const yearInHero = page
            .locator('a[href*="/releaseinfo/"]')
            .filter({ hasText: /^(19|20)\d{2}$/ })
            .first();
        await expect(yearInHero).toBeVisible();
        await expect(yearInHero).toHaveText(/^(19|20)\d{2}$/);
    });
});

/** Scenario 4: fallback URL matches “Sign in with IMDb” (imdb_us) when provider links are not in DOM. */
const IMDB_US_AP_SIGNIN =
    "https://www.imdb.com/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.imdb.com%2Fregistration%2Fap-signin-handler%2Fimdb_us%2F&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=imdb_us&openid.mode=checkid_setup&language=en_US&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&pageId=imdb_no_account_creation&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0";

const SCENARIO_4_EMAIL = "user_test_domain.com";
const SCENARIO_4_PASSWORD = "Pass123!";

test.describe("Scenario 4: IMDb sign-in flow (invalid email format)", () => {
    test("Sign In → Sign in with IMDb → submit credentials", async ({ page }) => {
        await page.goto("/");
        await dismissConsentIfPresent(page);

        await page.getByRole("link", { name: /^sign in$/i }).click();
        await expect(page).toHaveURL(/registration\/signin/i, { timeout: 30_000 });

        await dismissConsentIfPresent(page);

        await page
            .getByRole("button", { name: /sign in to an existing account/i })
            .click();

        const imdbApLink = page.locator('a[href*="/ap/signin"][href*="imdb_us"]');
        try {
            await expect(imdbApLink.first()).toBeAttached({ timeout: 45_000 });
            await imdbApLink.first().click();
        } catch {
            await page.goto(IMDB_US_AP_SIGNIN);
        }

        await page.waitForURL(/imdb\.com\/ap\//i, { timeout: 120_000 });

        const emailField = page.getByRole("textbox", {
            name: /enter mobile number or email/i,
        });
        await expect(emailField).toBeVisible({ timeout: 60_000 });
        await emailField.fill(SCENARIO_4_EMAIL);
        await page.getByRole("textbox", { name: /^password$/i }).fill(SCENARIO_4_PASSWORD);

        await page.getByRole("button", { name: /^sign in$/i }).click();

        await expect(page).toHaveURL(/imdb\.com|amazon\.com/i, { timeout: 30_000 });
    });
});
