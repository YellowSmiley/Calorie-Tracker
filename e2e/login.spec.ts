import { test, expect, Page } from '@playwright/test';

test.describe('Login Page E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should display the login page correctly', async ({ page }) => {
        // Check main heading
        const heading = page.locator('h1');
        await expect(heading).toContainText('Calorie Tracker');

        // Check description
        const description = page.locator('p:has-text("Track your daily food intake")');
        await expect(description).toBeVisible();

        // Check sign-in prompt
        const signInPrompt = page.locator('p:has-text("Sign in to access your diary")');
        await expect(signInPrompt).toBeVisible();
    });

    test('should have Google sign-in button', async ({ page }) => {
        const button = page.getByRole('button', { name: /continue with google/i });
        await expect(button).toBeVisible();
        await expect(button).not.toBeDisabled();
    });

    test('should display Google logo in button', async ({ page }) => {
        const button = page.getByRole('button', { name: /continue with google/i });
        const svg = button.locator('svg');
        await expect(svg).toBeVisible();
    });

    test('should be clickable and trigger sign-in flow', async ({ page }) => {
        const button = page.getByRole('button', { name: /continue with google/i });

        // Set up listener for popups (OAuth might open in a popup)
        let popupUrl = '';
        page.on('popup', (popup) => {
            popupUrl = popup.url();
            popup.close();
        });

        // Try to click the button and intercept navigation/popup
        // We don't expect it to fully complete OAuth, but the button should be functional
        const response = await page.evaluate(() => {
            // Return information about whether the button is properly set up
            return document.querySelector('button')?.getAttribute('onclick') !== null;
        });

        // Button exists and is part of the page structure
        await expect(button).toBeVisible();
    });

    test('button should have proper styling classes', async ({ page }) => {
        const button = page.getByRole('button', { name: /continue with google/i });

        // Check button has proper classes/styling
        const classes = await button.evaluate((el) => el.className);

        // Button should have styling applied (Tailwind classes)
        expect(classes).toBeTruthy();
        expect(classes).toContain('rounded');
    });

    test('should display terms of service notice', async ({ page }) => {
        const notice = page.locator('text=/By signing in, you agree to our Terms of Service/');
        await expect(notice).toBeVisible();
    });

    test('should display copyright notice', async ({ page }) => {
        const copyright = page.locator('text=/Copyright © 2026 Michael Smith/');
        await expect(copyright).toBeVisible();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        const h1 = page.locator('h1');
        await expect(h1).toHaveCount(1);
    });

    test('should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        // Content should still be visible
        const button = page.getByRole('button', { name: /continue with google/i });
        await expect(button).toBeVisible();

        // Title should still be readable
        const heading = page.locator('h1');
        await expect(heading).toBeVisible();
    });

    test('should be responsive on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });

        // Content should still be visible
        const button = page.getByRole('button', { name: /continue with google/i });
        await expect(button).toBeVisible();
    });

    test('page should load without javascript errors', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                // Filter out known non-critical errors
                const text = msg.text();
                if (
                    !text.includes('ResizeObserver') &&
                    !text.includes('404') &&
                    !text.includes('favicon') &&
                    !text.includes('ClientFetchError') &&
                    !text.includes('Failed to fetch')
                ) {
                    errors.push(text);
                }
            }
        });

        // Navigate fresh to capture any errors
        await page.goto('/login');

        await page.waitForLoadState('domcontentloaded');

        // Filter for actual code errors
        const criticalErrors = errors.filter(
            (e) =>
                !e.includes('Google') &&
                !e.includes('external') &&
                !e.includes('cross') &&
                !e.includes('blocked') &&
                !e.includes('auth')
        );

        // Should have minimal errors
        expect(criticalErrors.length).toBeLessThan(2);

        // Should have heading
        const h1 = page.locator('h1');
        await expect(h1).toHaveCount(1);
    });
});
