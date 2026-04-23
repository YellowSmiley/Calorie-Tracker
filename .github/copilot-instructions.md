# Copilot Instructions for Calorie Tracker

## Goals

- Keep Playwright and Jest test suites green.
- Prevent avoidable UI/component duplication by preferring shared components.
- Preserve existing architecture and avoid broad refactors unless requested.

## Required Checks Before Finalizing Changes

When making code changes, run these checks in this order when feasible:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run test:ci`
4. Playwright is optional per change. Instead of running Playwright every time, add/update TODO comments in the related `e2e/*.spec.ts` file(s) describing coverage that should be added later.

Run Playwright manually when explicitly requested by the user, when debugging an end-to-end failure, or before major releases.
For this workspace, local Playwright is only reliable when tests are run one at a time and not in headless mode. When needed, prefer a single spec, single project, headed run such as `npm run test:e2e -- e2e/diary.spec.ts --project=chromium --workers=1 --headed`.

## Component Reuse Rules

- If similar JSX/TSX structure appears in 2+ places, prefer extracting a shared component.
- Prefer placing reusable UI in `app/components/` or a feature `components/` folder.
- Keep extracted components focused and prop-driven.
- Do not duplicate validation, formatting, or display logic; move shared logic to `lib/` utilities when appropriate.

## Utility and Test Rules

- Default to extracting non-trivial logic from UI/components/routes into `lib/` whenever feasible.
- If logic is repeated in 2+ places (validation, formatting, calculations, query shaping), extract it to a `lib/` utility unless there is a clear reason not to.
- When adding or changing a `lib/` utility, add or update Jest tests in `lib/*.test.ts` in the same change.
- If repeated code is intentionally not extracted, explicitly explain why in the final response.
- Always update relevant in-app help text, tutorials, and guidance copy in the same change when user workflows or behavior are changed.

## Action Feedback & Validation Rules

- For any user-triggered action, provide clear feedback as appropriate: loading state, success confirmation, and error messaging.
- Do not rely on silent updates for important user actions; users should be able to tell what happened.
- Add validation for all inputs that submit data, with visible and accessible error messaging.

## API Validation and Contract Rules

- Centralize API validation with shared schemas in `lib/apiSchemas.ts` instead of duplicating ad-hoc parsing/guards in each route.
- Standardize API success and error contracts using shared helpers in `lib/apiResponse.ts` (consistent `ok/status/data` and `code/message/error` patterns).
- When adding or changing schemas or response helpers, update the relevant Jest tests in `lib/apiSchemas.test.ts` and/or `lib/apiResponse.test.ts` in the same change.

## Jest Scope Rules

- Use Jest for unit and business-logic tests only (pure functions, calculations, validation, transforms, and API/helper logic).
- Do not add Jest tests that primarily verify page rendering flows, component interaction journeys, routing, or end-to-end behavior; cover those with Playwright instead.
- If an existing Jest test in `app/**/page.test.tsx` grows into journey-style interaction coverage, extract the non-trivial logic to `lib/` and migrate the journey scenarios to Playwright TODOs in related `e2e/*.spec.ts` files.
- When UI features include non-trivial logic, extract that logic to `lib/` and test it with Jest, then keep the user-flow validation in Playwright.
- Prefer focused Jest runs for changed units (for example `npm run test:ci -- lib/someUtility.test.ts`) before broader suites.

## Playwright Stability Rules

- Prefer stable selectors using `data-testid` for interactive elements used by end-to-end tests.
- Do not remove or rename existing `data-testid` attributes without updating affected Playwright specs in the same change.
- For UI refactors, verify Playwright selectors still match and call out any selector migrations in the final response.
- When adding any UI feature, check whether the change needs Playwright coverage in both default units and converted units, and add/update TODO comments in the relevant Playwright spec(s) when coverage is deferred.
- Ensure BDD-style Playwright tests are focused on user behaviors and outcomes, not implementation details. If a test is failing due to a non-user-facing change, update the test to be more resilient rather than changing the implementation to fit the test.

## PR/Review Mindset

- Call out potential regressions first.
- Highlight missing tests for changed behaviors.
- Flag repeated UI patterns that should become shared components.

## Scope and Safety

- Do not introduce new tooling (hooks/CI/deps) unless explicitly requested.
- Keep changes minimal and aligned with existing project style.
- Avoid touching unrelated files.

## Architecture Consistency Rules

- When the user requests an architectural change intended as an ongoing pattern, update this file in the same change so the rule persists for future work.
- Treat these user-directed architecture decisions as project standards going forward unless the user explicitly overrides them later.
- Apply established patterns consistently across relevant routes/components/utilities, not only in the one file being edited.
- Current standing examples of persistent architecture rules:
  - Use transaction boundaries for multi-step write operations to avoid partial state.
  - Move repetitive authentication/authorization checks into reusable guard utilities.
  - Extract non-trivial domain/business logic from complex API routes into dedicated service-layer modules in `lib/` (for example `mealService`, `foodModerationService`, `accountService`) and keep route handlers focused on transport concerns (auth, validation, response mapping).

## API Route Audit Logging Rules

- Log all admin-initiated actions via `logAdminAction(prisma, {...})` after successful state changes (from `lib/auditService.ts`).
- Log all user-triggered mutations (meals, foods, settings, body weight, account changes) to create an audit trail for compliance and debugging.
- Include in every log entry: `actorId`, `targetType`, `targetId`, `action`, and `requestId` (via `getRequestId(request)`).
- Include relevant `metadata` that captures the outcome: updated field names, punishment counts, etc. Avoid logging sensitive data (passwords, full IP addresses).
- Optionally include a `reason` field when the action is admin-initiated or requires justification.
- When defining new mutations, add the corresponding action to `AUDIT_ACTIONS` array in `lib/auditService.ts` and ensure the route logs it.
- For production deployments, implement periodic log cleanup/archival via a scheduled task or admin-only endpoint to manage database growth (e.g., delete logs older than 90 days per compliance requirements).
- Document your organization's log retention policy in `README.md` under the "Log retention and cleanup" subsection.

## Caching and Data-Fetch Strategy

**Development Mode (Lax by Default):**

- In development (`NODE_ENV !== "production"`), keep caching relaxed to reduce stale-data confusion while debugging.
- Prefer `no-store` response headers or `revalidate: 0` for server-component caches in dev.
- Apply full TTL caching rules below only in production.

**Sensitive Routes (No Cache):**

- Always use `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` for:
  - Authentication endpoints (login, register, verify, password reset)
  - Account operations (profile export, account deletion)
  - Admin mutations (user/food management, punishments)
  - Rate-limited routes (prevent cache bypass)
- Example: [app/api/account/export/route.ts](app/api/account/export/route.ts#L147)

**Read-Heavy Routes (Controlled Caching with Revalidation):**

- Use environment-aware TTL caching for user-specific data:
  - **User Settings** (1–5 min): Cached per user, revalidate on settings update
  - **Meal Entries by Date** (1–5 min): Cached, revalidate on meal CRUD
  - **Food Search** (10–30 min): Cached, revalidate on food approval/update
  - **Dashboard Metrics** (2–5 min): Cached, revalidate on meal changes
  - **Body Weight Entries** (5–10 min): Cached, revalidate on weight entry
  - **Meal Favorites** (10–30 min): Cached, revalidate on favorite changes
- Pattern:
  ```typescript
  // GET /api/settings
  const response = apiSuccess({
    /* data */
  });
  response.headers.set("Cache-Control", "private, max-age=300"); // 5 min
  return response;
  ```
- Mutations should return fresh data and rely on short TTL revalidation where appropriate:
  ```typescript
  // PATCH /api/settings
  await logAdminAction(...); // existing audit logging
  return apiSuccess({ /* updated data */ });
  ```

\*\*Server Components (Redundancy Prevention):

- Wrap user-specific fetches in `unstable_cache()` with revalidation tags:
  ```typescript
  // app/page.tsx (dashboard server component)
  const settings = await unstable_cache(
    async () => fetch(`/api/settings?userId=${userId}`),
    [`settings:${userId}`],
    { revalidate: 300, tags: [`settings:${userId}`] }, // 5 min
  )();
  ```
- This prevents redundant fetches across multiple pages loading the same user settings.

**Environment-Aware Cache Config:**

- Centralize cache behavior in `lib/cacheKeys.ts`.
- Use a production guard (for example `IS_PRODUCTION_CACHE`) so development defaults remain lax.

**Tag-Based Invalidation Convention:**

- Use format: `{resource}:{userId}` for user-scoped data
- Use format: `{resource}` for global/admin data
- Examples: `settings:user-123`, `meals:user-123:2026-04-23`, `foods`, `users`
- Define tags in a shared location (e.g., `lib/cacheKeys.ts`) to prevent drift

**When NOT to Cache:**

- User-initiated mutations (always fresh response)
- Real-time admin operations (need immediate visibility)
- Data with compliance/privacy concerns (default to no-store)
- Routes behind feature flags or experiments (avoid stale variants)

## Documentation Upkeep

- After implementing a feature, security hardening, or architecture change, explicitly check whether `README.md` should be updated in the same change.
- If user-facing behavior, setup steps, API contracts, or key technical decisions changed, update `README.md` before finalizing.
- When intentionally not updating `README.md`, briefly explain why in the final response.

## UI Color Consistency

- Keep UI colors monochrome throughout the app: whites, blacks, and greys only.
- Do not introduce accent colors (for example blue, green, purple, red) for links, buttons, badges, highlights, or focus states unless explicitly requested.
- Prefer existing zinc/neutral classes and maintain consistent contrast in both light and dark themes.

## Accessibility Standards

- Treat accessibility as a default requirement for every change.
- Use semantic HTML, associated labels, keyboard-accessible controls, and visible focus states for all interactive elements.
- Provide screen-reader support with meaningful names, instructions, and live/error messaging where relevant.
- Ensure color is not the only way information is conveyed.
