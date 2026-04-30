import type { Locator, Page } from "@playwright/test";

/** Main IMDb search field on the homepage (navbar). */
export function imdbSearchInput(page: Page): Locator {
    return page
        .getByPlaceholder(/search/i)
        .or(page.locator('input[name="q"]'))
        .or(page.locator('[data-testid="suggestion-search"]'))
        .first();
}

/**
 * Dismisses common consent banners (OneTrust / generic Accept) if shown.
 */
export async function dismissConsentIfPresent(page: Page): Promise<void> {
    const candidates = [
        page.locator("#onetrust-accept-btn-handler"),
        page.getByRole("button", { name: /^accept/i }),
        page.getByRole("button", { name: /accept all/i }),
    ];
    for (const loc of candidates) {
        try {
            if (await loc.first().isVisible({ timeout: 2500 })) {
                await loc.first().click({ timeout: 5000 });
                return;
            }
        } catch {
            /* try next */
        }
    }
}
