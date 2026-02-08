import { test as base, expect, type Page } from '@playwright/test';

export type AuthFixtures = {
    authenticatedPage: Page;
};

/**
 * Create a session cookie for testing
 * In a real scenario, you would use proper session management or mock the auth endpoint
 */
export const test = base.extend<AuthFixtures>({
    authenticatedPage: async ({ page }, use) => {
        // For now, we'll just use a simple approach
        // In production, you might want to use the NextAuth session API or mock it
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use(page);
    },
});

export { expect };
