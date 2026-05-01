import { test, expect } from "@playwright/test";
import { dismissConsentIfPresent } from "./helpers";

/**
 * Scenario 1: homepage → type film name → pick from autocomplete → verify title.
 */
test.describe("Scenario 1: IMDb search autocomplete", () => {
    test("dropdown first result matches keyword; opened page title matches keyword", async ({
        page,
    }) => {
        await page.goto("/");
        await dismissConsentIfPresent(page);

        const search = page.getByRole("textbox", { name: "Search IMDb" }).first();
        await search.fill("Inception");

        const listbox = page.getByRole("listbox").first();
        await expect(listbox).toBeVisible({ timeout: 15_000 });

        const firstOption = listbox.getByRole("option").first();
        await Promise.all([
            expect(firstOption).toBeVisible({ timeout: 15_000 }),
            expect(firstOption).toContainText("Inception", { timeout: 15_000 })
        ]);

        await firstOption.click();

        await Promise.all([
            expect(page).toHaveURL(/\/title\/tt\d+/i, { timeout: 15_000 }),
            expect(page.getByRole("heading", { level: 1 })).toContainText(
                "Inception",
                { timeout: 15_000 }
            )
        ]);
    });
});

/**
 * Scenario 2: homepage → nonsense search → Enter → empty results page.
 */
test.describe("Scenario 2: IMDb search no results", () => {
    test("shows no results message and no movie result cards", async ({ page }) => {
        await page.goto("/");
        await dismissConsentIfPresent(page);

        const search = page.getByRole("textbox", { name: "Search IMDb" }).first();
        await search.fill("zxcvbnm123");
        await search.press("Enter");

        await expect(page).toHaveURL(/find/i, { timeout: 15_000 });

        const noResultsBanner = page
            .getByRole("generic")
            .getByTestId("results-section-empty-results-msg")
            .first();
        await Promise.all([
            expect(noResultsBanner).toBeVisible({ timeout: 20_000 }),
            expect(noResultsBanner).toContainText(/No results found for/i, { timeout: 15_000 }),
            expect(noResultsBanner).toContainText("zxcvbnm123", { timeout: 15_000 })
        ]);
    });
});

/**
 * Scenario 3: Top 250 chart → open first title → verify title page details.
 */
test.describe("Scenario 3: IMDb Top 250 first film", () => {
    test("opens title page with name, rating, and release year", async ({ page }) => {
        await page.goto("/chart/top/");
        await dismissConsentIfPresent(page);

        const firstRow = page
            .locator("li.ipc-metadata-list-summary-item")
            .first();
        await expect(firstRow).toBeVisible({ timeout: 15_000 });
        const firstFilmLink = firstRow.getByRole("link").first();
        await firstFilmLink.click();

        await expect(page).toHaveURL(/\/title\/tt\d+/i, { timeout: 15_000 });

        const titleHeading = page.getByRole("heading", { level: 1 });
        await Promise.all([
            expect(titleHeading).toBeVisible({ timeout: 15_000 }),
            expect(titleHeading).not.toBeEmpty({ timeout: 15_000 })
        ]);

        const ratingScore = page
            .getByTestId("hero-rating-bar__aggregate-rating__score")
            .first();
        await Promise.all([
            expect(ratingScore).toBeVisible({ timeout: 15_000 }),
            expect(ratingScore).toHaveText(/\d/, { timeout: 15_000 })
        ]);

        const yearInHero = page.getByRole("link", { name: /^\d{4}$/ }).first();
        await Promise.all([
            expect(yearInHero).toBeVisible({ timeout: 15_000 }),
            expect(yearInHero).toHaveText(/^(19|20)\d{2}$/, { timeout: 15_000 })
        ]);
    });
});

/** 
 * Scenario 4: fallback URL matches “Sign in with IMDb” (imdb_us) when provider links are not in DOM. 
 */
test.describe("Scenario 4: IMDb sign-in flow (invalid email format)", () => {
    test("Sign In → Sign in with IMDb → submit credentials", async ({ page }) => {
        await page.goto("/");
        await dismissConsentIfPresent(page);

        await page.getByRole("link", { name: /^sign in$/i }).click();
        await expect(page).toHaveURL(/registration\/signin/i, { timeout: 15_000 });

        await dismissConsentIfPresent(page);

        await page
            .getByRole("button", { name: /sign in to an existing account/i })
            .click();

        await page
            .getByRole("link", { name: /sign in with imdb/i })
            .click();

        await page.waitForURL(/imdb\.com\/ap\//i, { timeout: 120_000 });

        const emailField = page.getByRole("textbox", {
            name: /enter mobile number or email/i,
        });
        await expect(emailField).toBeVisible({ timeout: 15_000 });
        await emailField.fill("user_test_domain.com");
        await page.getByRole("textbox", { name: /^password$/i }).fill("Pass123!");

        await page.getByRole("button", { name: /^sign in$/i }).click();

        const errorMessage = page.getByRole("heading", { name: /there was a problem/i});
        await expect(errorMessage).toBeVisible({ timeout: 15_000 });

        await expect(page).toHaveURL(/imdb\.com\/ap\//i, { timeout: 15_000 });
    });
});
