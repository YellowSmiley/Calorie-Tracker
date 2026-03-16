# Copilot Instructions for Calorie Tracker

## Goals

- Keep Playwright and Jest test suites green.
- Prevent avoidable UI/component duplication by preferring shared components.
- Preserve existing architecture and avoid broad refactors unless requested.

## Required Checks Before Finalizing Changes

When making code changes, run these checks in this order when feasible:

1. `npm run lint`
2. `npm run test:ci`
3. `npm run test:e2e`

If a full Playwright run is too slow for the task, run the most relevant Playwright spec(s) first, then call out that full `npm run test:e2e` is still recommended.

## Component Reuse Rules

- If similar JSX/TSX structure appears in 2+ places, prefer extracting a shared component.
- Prefer placing reusable UI in `app/components/` or a feature `components/` folder.
- Keep extracted components focused and prop-driven.
- Do not duplicate validation, formatting, or display logic; move shared logic to `lib/` utilities when appropriate.

## Utility and Test Rules

- If logic is repeated in 2+ places (validation, formatting, calculations, query shaping), extract it to a `lib/` utility unless there is a clear reason not to.
- When adding or changing a `lib/` utility, add or update Jest tests in `lib/*.test.ts` in the same change.
- If repeated code is intentionally not extracted, explicitly explain why in the final response.

## Playwright Stability Rules

- Prefer stable selectors using `data-testid` for interactive elements used by end-to-end tests.
- Do not remove or rename existing `data-testid` attributes without updating affected Playwright specs in the same change.
- For UI refactors, verify Playwright selectors still match and call out any selector migrations in the final response.

## PR/Review Mindset

- Call out potential regressions first.
- Highlight missing tests for changed behavior.
- Flag repeated UI patterns that should become shared components.

## Scope and Safety

- Do not introduce new tooling (hooks/CI/deps) unless explicitly requested.
- Keep changes minimal and aligned with existing project style.
- Avoid touching unrelated files.
