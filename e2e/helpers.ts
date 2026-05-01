import type { Locator, Page } from "@playwright/test";

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
