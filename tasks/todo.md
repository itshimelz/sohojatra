# Task List: Sohojatra MVP Phase 1

## Phase 1 - Foundation

## Task 1: Establish route groups and shared app shell (Completed)

**Description:** Create the base route-group structure and shared layout primitives for marketing, auth, and citizen experiences while preserving existing root layout behavior.

**Acceptance criteria:**

- [x] Route groups for marketing/auth/citizen are present and compile.
- [x] Root layout still renders all routes without hydration errors.
- [x] Navigation entry points for landing/auth/concerns exist (can be placeholders).

**Verification:**

- [x] Build succeeds: `npm run build`
- [x] Manual check: navigate `/`, auth route, and concerns route without runtime crash

**Dependencies:** None

**Files likely touched:**

- `app/layout.tsx`
- `app/(marketing)/page.tsx`
- `app/(auth)/...`
- `app/(citizen)/...`

**Estimated scope:** M (3-5 files)

## Task 2: Implement i18n foundation with locale persistence

**Description:** Add dictionary-based i18n utilities for Bangla and English, including locale resolution and persisted language toggle behavior.

**Acceptance criteria:**

- [ ] Dictionary files exist for `en` and `bn` with shared keys for landing/auth/concerns basics.
- [ ] Locale switch updates rendered UI strings.
- [ ] Selected locale persists across navigation and refresh.

**Verification:**

- [ ] Type checks pass: `npm run typecheck`
- [ ] Manual check: switch language and refresh page; locale remains selected

**Dependencies:** Task 1

**Files likely touched:**

- `lib/i18n/*`
- `components/...language-toggle...`
- `app/layout.tsx` or route-group layout file

**Estimated scope:** M (3-5 files)

## Task 3: Add Supabase configuration and client wrappers

**Description:** Implement server/client Supabase helper modules with strict environment validation and safe secret boundaries.

**Acceptance criteria:**

- [ ] Server and client Supabase helpers are separated correctly.
- [ ] Missing env variables fail fast with clear error paths.
- [ ] No service-role secrets are referenced in client code.

**Verification:**

- [ ] Lint + typecheck pass: `npm run lint && npm run typecheck`
- [ ] Manual check: app starts with valid env and fails with invalid env as expected

**Dependencies:** Task 1

**Files likely touched:**

- `lib/auth/*`
- `lib/config/*`
- `.env.example`

**Estimated scope:** S-M (2-4 files)

## Checkpoint A - Foundation Complete

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] Locale toggle and Supabase config smoke checks pass
- [ ] Human review before core features

## Phase 2 - Core Vertical Slices

## Task 4: Deliver bilingual landing page at `/`

**Description:** Replace placeholder home page with a production-oriented landing page presenting Sohojatra value proposition, bilingual copy, and clear CTAs into auth and concerns.

**Acceptance criteria:**

- [ ] Home page at `/` matches MVP purpose with citizen-first messaging.
- [ ] All landing strings come from i18n keys.
- [ ] CTA buttons route to auth and concern entry points.
- [ ] Layout is usable at 360px and desktop widths.

**Verification:**

- [ ] Build succeeds: `npm run build`
- [ ] Manual check: `360px` viewport + desktop; language switch updates landing copy

**Dependencies:** Tasks 1-2

**Files likely touched:**

- `app/(marketing)/page.tsx`
- `components/...landing...`
- `lib/i18n/dictionaries/*`

**Estimated scope:** M (3-5 files)

## Task 5: Implement OTP auth flow (signup/login/session)

**Description:** Build complete citizen authentication flow using Supabase phone OTP and protect concern routes for authenticated users.

**Acceptance criteria:**

- [ ] Citizen can request OTP and complete sign-in.
- [ ] Session persists across refresh.
- [ ] Concern routes require authenticated session.
- [ ] OTP request limit behavior is surfaced with localized messaging.

**Verification:**

- [ ] Lint + typecheck pass: `npm run lint && npm run typecheck`
- [ ] Manual check: login, refresh, logout, and route guard behavior

**Dependencies:** Tasks 2-3

**Files likely touched:**

- `app/(auth)/*`
- `lib/auth/*`
- `middleware.ts` (if used for guards)

**Estimated scope:** M (3-5 files)

## Task 6: Implement concern submission slice

**Description:** Build authenticated concern submission flow end-to-end, including validation, photo count cap, GPS pin capture, status initialization, and tracking ID generation.

**Acceptance criteria:**

- [ ] Authenticated citizen can submit title, description, category, <=3 photos, and GPS pin.
- [ ] Submission creates concern with initial status `Submitted` and tracking ID.
- [ ] Validation and error messages are localized.

**Verification:**

- [ ] Build succeeds: `npm run build`
- [ ] Manual check: submit valid/invalid forms and verify tracking ID + status

**Dependencies:** Tasks 2-3, Task 5

**Files likely touched:**

- `app/(citizen)/concerns/new/*`
- `lib/concerns/*`
- `app/api/*` or server actions module

**Estimated scope:** M (3-5 files)

## Task 7: Implement concern list and one-vote upvoting

**Description:** Build concern list UI and data flow with sorting by upvotes then recency, plus authenticated one-vote-per-user enforcement.

**Acceptance criteria:**

- [ ] Concern list sorts by upvotes first, then recency.
- [ ] Authenticated citizen can upvote once per concern.
- [ ] Duplicate vote attempts are blocked with localized feedback.

**Verification:**

- [ ] Type checks pass: `npm run typecheck`
- [ ] Manual check: upvote once, attempt second upvote, confirm ordering behavior

**Dependencies:** Task 6

**Files likely touched:**

- `app/(citizen)/concerns/page.tsx`
- `lib/concerns/sorting.ts`
- `lib/concerns/votes.ts`

**Estimated scope:** M (3-5 files)

## Task 8: Implement concern tracking timeline view

**Description:** Build concern detail/tracking page showing lifecycle timeline (`Submitted -> Under Review -> Resolved/Rejected`) with timestamps and official notes.

**Acceptance criteria:**

- [ ] Concern detail shows full timeline with ordered status events.
- [ ] Each event displays timestamp; official note appears where available.
- [ ] Unauthorized access to private concern details is blocked.

**Verification:**

- [ ] Build succeeds: `npm run build`
- [ ] Manual check: track a submitted concern and verify timeline rendering

**Dependencies:** Task 6

**Files likely touched:**

- `app/(citizen)/concerns/[id]/page.tsx`
- `components/...timeline...`
- `lib/concerns/tracking.ts`

**Estimated scope:** M (3-5 files)

## Checkpoint B - Core Features Complete

- [ ] Core flow works end-to-end: landing -> auth -> submit -> list/upvote -> tracking
- [ ] Manual mobile check completed at `360px`
- [ ] No hardcoded UI strings in feature code
- [ ] Human review before hardening

## Phase 3 - Hardening and Verification

## Task 9: Add automated tests for critical MVP paths

**Description:** Add and wire test tooling, then cover critical domain and user paths with unit, integration, and e2e tests.

**Acceptance criteria:**

- [ ] Test runner scripts exist for unit/integration/e2e.
- [ ] Unit tests cover sorting, vote limits, and validation helpers.
- [ ] Integration/E2E cover authentication and submission/tracking happy path.

**Verification:**

- [ ] Tests pass: `npm run test:unit && npm run test:integration && npm run test:e2e`
- [ ] Build still passes: `npm run build`

**Dependencies:** Tasks 5-8

**Files likely touched:**

- `package.json`
- `tests/unit/*`
- `tests/integration/*`
- `tests/e2e/*`

**Estimated scope:** M (3-5 files per sub-area; execute incrementally)

## Task 10: Accessibility, security, and release gate checks

**Description:** Perform WCAG form checks, secret exposure checks, and final quality gate aligned with project boundaries.

**Acceptance criteria:**

- [ ] Core forms satisfy WCAG 2.1 AA basics (labels, keyboard, focus, errors).
- [ ] No secrets are exposed in client bundle or source control.
- [ ] Final quality gate command sequence passes.

**Verification:**

- [ ] Run: `npm run lint && npm run typecheck && npm run build`
- [ ] Manual check: keyboard-only pass on landing/auth/submission forms

**Dependencies:** Tasks 4-9

**Files likely touched:**

- `app/*`
- `components/*`
- `docs/*` (release checklist notes)

**Estimated scope:** S-M (2-5 files)

## Checkpoint C - Ready for Implementation Completion

- [ ] All in-scope MVP acceptance criteria from `SPEC.md` are met
- [ ] All tests and build checks pass
- [ ] Boundaries respected (`Always`, `Ask first`, `Never`)
- [ ] Human sign-off before production deployment
