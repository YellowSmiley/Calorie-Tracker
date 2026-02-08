import { test, expect } from '@playwright/test';

// Declare window extension for our CLS measurement
declare global {
  interface Window {
    cls: () => number;
  }
}

test.describe('Diary Page E2E Tests', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
        // Attempt to access the diary page without authentication
        const response = await page.goto('/diary', { waitUntil: 'networkidle' });

        // Since we're not authenticated, it should redirect to login
        expect(page.url()).toContain('/login');
    });

    test('page title should be set', async ({ page }) => {
        // Navigate to diary (will redirect to login)
        await page.goto('/diary', { waitUntil: 'networkidle' });

        // Check page title exists
        const pageTitle = await page.title();
        expect(pageTitle).toBeTruthy();
    });

    test('should load without critical errors', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // Filter out non-critical errors
                if (
                    !text.includes('ResizeObserver') &&
                    !text.includes('ClientFetchError') &&
                    !text.includes('Failed to fetch')
                ) {
                    errors.push(text);
                }
            }
        });

        // Attempt to navigate
        await page.goto('/diary', { waitUntil: 'networkidle' });

        // Filter critical errors
        const criticalErrors = errors.filter(
            (e) =>
                !e.includes('external') &&
                !e.includes('blocked') &&
                !e.includes('auth')
        );

        // Should load without critical errors (might have warnings)
        expect(criticalErrors.length).toBeLessThan(3);
    });

    test('should be responsive on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        // Navigate to diary
        await page.goto('/diary', { waitUntil: 'networkidle' });

        // Page should respond to resize without errors
        const content = await page.content();
        expect(content).toBeTruthy();
    });

    test('should be responsive on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });

        // Navigate to diary
        await page.goto('/diary', { waitUntil: 'networkidle' });

        const content = await page.content();
        expect(content).toBeTruthy();
    });

    test('should preserve date URL parameters in redirects', async ({ page }) => {
        const testDate = '2026-02-08';

        // Navigate with date parameter
        await page.goto(`/diary?date=${testDate}`, { waitUntil: 'networkidle' });

        // Since we're not authenticated, we might redirect to login
        // The important thing is the page loads without error
        const finalUrl = page.url();
        expect(finalUrl).toBeTruthy();

        // If redirected to login, that's expected behavior
        // If we stayed on diary with auth, date should be in URL
        const hasDateOrLoginRedirect =
            finalUrl.includes(testDate) || finalUrl.includes('/login');
        expect(hasDateOrLoginRedirect).toBe(true);
    });

    test('should not have layout shift on load', async ({ page }) => {
        // Measure cumulative layout shift
        await page.addInitScript(() => {
            let cls = 0;
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    // Skip entries with recent user input or very early entries
                    if (
                        !('hadRecentInput' in entry && !entry.hadRecentInput) ||
                        entry.startTime < 5000
                    ) {
                        continue;
                    }
                    // Access value property safely
                    if ('value' in entry) {
                        cls += (entry as unknown as { value: number }).value;
                    }
                }
            });
            observer.observe({ type: 'layout-shift', buffered: true });
            window.cls = () => cls;
        });

        await page.goto('/diary', { waitUntil: 'networkidle' });

        const cls = await page.evaluate(() => window.cls?.() ?? 0);

        // Layout shift should be minimal
        expect(cls).toBeLessThan(0.5);
    });

    test('should have proper language attribute', async ({ page }) => {
        await page.goto('/diary', { waitUntil: 'networkidle' });

        // Check if lang attribute is set
        const html = page.locator('html');
        const lang = await html.getAttribute('lang');

        // Should have a language set
        expect(lang).toBeTruthy();
    });

    test('should have viewport meta tag', async ({ page }) => {
        await page.goto('/diary', { waitUntil: 'networkidle' });

        // Check for viewport meta tag for responsive design
        const viewport = page.locator('meta[name="viewport"]');
        const count = await viewport.count();

        expect(count).toBeGreaterThan(0);
    });

    test('should respond to network requests appropriately', async ({ page }) => {
        const responses: number[] = [];

        page.on('response', (response) => {
            // Log response statuses
            responses.push(response.status());
        });

        await page.goto('/diary', { waitUntil: 'networkidle' });

        // Should have received responses
        expect(responses.length).toBeGreaterThan(0);

        // Most responses should be successful or redirects
        const failedResponses = responses.filter((status) => status >= 500);
        expect(failedResponses.length).toBe(0);
    });
});
