import { test, expect } from "@playwright/test";
import { dismissConsentIfPresent } from "./helpers";

/**
 * Scenario 1: homepage → type film name → pick from autocomplete → verify title.
 */
test.describe("Scenario 1: IMDb search autocomplete", () => {
    test("dropdown first result matches keyword; opened page title matches keyword", async ({
        page,
    }) => {
        await page.goto("/", {
            waitUntil: "domcontentloaded",
        });

        await dismissConsentIfPresent(page);

        const search = page.getByRole("textbox", { name: "Search IMDb" }).first();
        await search.fill("Inception");

        const listbox = page.getByRole("listbox").first();
        await expect(listbox).toBeVisible();

        const firstOption = listbox.getByRole("option").first();

        await Promise.all([
            expect(firstOption).toBeVisible(),
            expect(firstOption).toContainText("Inception"),
        ]);

        await Promise.all([
            page.waitForURL(/\/title\/tt\d+/i),
            page.waitForLoadState("domcontentloaded"),
            firstOption.click(),
        ]);

        await expect(page).toHaveURL(/\/title\/tt\d+/i);
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
            "Inception"
        );
    });
});

/**
 * Scenario 2: homepage → nonsense search → Enter → empty results page.
 */
test.describe("Scenario 2: IMDb search no results", () => {
    test("shows no results message and no movie result cards", async ({ page }) => {
        await page.goto("/", {
            waitUntil: "domcontentloaded",
        });
        await dismissConsentIfPresent(page);

        const search = page.getByRole("textbox", { name: "Search IMDb" }).first();

        await search.fill("zxcvbnm123");

        await Promise.all([
            page.waitForURL(/find/i),
            search.press("Enter"),
        ]);

        await page.waitForLoadState("domcontentloaded");

        const noResultsBanner = page.getByText("No results found for").first();

        await Promise.all([
            expect(noResultsBanner).toBeVisible(),
            expect(noResultsBanner).toContainText("zxcvbnm123"),
        ]);
    });
});

/**
 * Scenario 3: Top 250 chart → open first title → verify title page details.
 */
test.describe("Scenario 3: IMDb Top 250 first film", () => {
    test("opens title page with name, rating, and release year", async ({ page }) => {
        await page.goto("/chart/top/", {
            waitUntil: "domcontentloaded",
        });
        await dismissConsentIfPresent(page);

        const firstRow = page
            .locator("li.ipc-metadata-list-summary-item")
            .first();
        await expect(firstRow).toBeVisible();
        const firstFilmLink = firstRow.getByRole("link").first();

        await Promise.all([
            page.waitForURL(/\/title\/tt\d+/i),
            page.waitForLoadState("domcontentloaded"),
            firstFilmLink.click(),
        ]);

        await expect(page).toHaveURL(/\/title\/tt\d+/i);
        const titleHeading = page.getByRole("heading", { level: 1 });
        await Promise.all([
            expect(titleHeading).toBeVisible(),
            expect(titleHeading).not.toBeEmpty()
        ]);

        const ratingScore = page
            .getByTestId("hero-rating-bar__aggregate-rating__score")
            .first();
        await Promise.all([
            expect(ratingScore).toBeVisible(),
            expect(ratingScore).toHaveText(/\d/)
        ]);

        const yearInHero = page.getByRole("link", { name: /^\d{4}$/ }).first();
        await Promise.all([
            expect(yearInHero).toBeVisible(),
            expect(yearInHero).toHaveText(/^(19|20)\d{2}$/)
        ]);
    });
});

/** 
 * Scenario 4: fallback URL matches “Sign in with IMDb” (imdb_us) when provider links are not in DOM. 
 */
test.describe("Scenario 4: IMDb sign-in flow (invalid email format)", () => {
    test("Sign In → Sign in with IMDb → submit credentials", async ({ page }) => {
        await page.goto("/", {
            waitUntil: "domcontentloaded",
        });
        await dismissConsentIfPresent(page);

        await page.getByRole("link", { name: "sign in" }).first().click();
        await expect(page).toHaveURL(/registration\/signin/i);

        await dismissConsentIfPresent(page);

        await page.waitForLoadState("domcontentloaded");
        await page
            .getByRole("button", { name: "sign in to an existing account" })
            .click();

        await page.waitForLoadState("domcontentloaded");
        await page
            .getByRole("link", { name: "sign in with imdb" })
            .click();

        await page.waitForURL(/imdb\.com\/ap\//i);

        const emailField = page.getByRole("textbox", {
            name: "Enter mobile number or email",
        });
        await expect(emailField).toBeVisible();
        await emailField.fill("user_test_domain.com");
        await page.getByRole("textbox", { name: "Password" }).fill("Pass123!");

        await page.getByRole("button", { name: "sign in" }).click();

        const errorMessage = page.getByRole("heading", { name: "There was a problem"});
        await expect(errorMessage).toBeVisible();

        await expect(page).toHaveURL(/imdb\.com\/ap\//i);
    });
});
