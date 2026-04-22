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
4. `npm run test:e2e`

If a full Playwright run is too slow for the task, run the most relevant Playwright spec(s) first, then call out that full `npm run test:e2e` is still recommended.
For this workspace, local Playwright is only reliable when tests are run one at a time and not in headless mode. Prefer a single spec, single project, headed run such as `npm run test:e2e -- e2e/diary.spec.ts --project=chromium --workers=1 --headed`.

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
- When UI features include non-trivial logic, extract that logic to `lib/` and test it with Jest, then keep the user-flow validation in Playwright.
- Prefer focused Jest runs for changed units (for example `npm run test:ci -- lib/someUtility.test.ts`) before broader suites.

## Playwright Stability Rules

- Prefer stable selectors using `data-testid` for interactive elements used by end-to-end tests.
- Do not remove or rename existing `data-testid` attributes without updating affected Playwright specs in the same change.
- For UI refactors, verify Playwright selectors still match and call out any selector migrations in the final response.
- When adding any UI feature, check whether the change needs Playwright coverage, in both default units and converted units, and tests pass with all added scenarios before finalizing.
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
