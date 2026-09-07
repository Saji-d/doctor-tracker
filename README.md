# Doctor Tracker

A secure admin app for managing doctors and their patients — search/filter/paginated lists, a live analytics dashboard, built as a separate Next.js frontend (`frontend/`) and Express/MongoDB backend (`backend/`) communicating over REST.

**This file is a development progress log, updated after every phase**, not the polished project README yet — that gets written properly in the dedicated README phase (Phase 15, see `IMPLEMENTATION_PLAN.md` §16), once every feature exists to document. Until then, this is the most accurate picture of what's actually built and verified so far.

## Workspace layout

```
X:\ZnZ\                    ONE git repo, connected to https://github.com/Saji-d/doctor-tracker.git (main)
├── backend/                Express API
├── frontend/                Next.js app
├── IMPLEMENTATION_PLAN.md   full architecture/requirements/phase plan (gitignored, local only)
└── README.md                this file (gitignored, local only)
```

**Repo structure note:** originally set up as two independent repos (one per app), then explicitly changed to a single shared repo with `backend/` and `frontend/` as subfolders — mirrored on GitHub too, both apps in one place. Backend's existing 6-commit history was preserved (not squashed) via `git subtree`, so the per-phase commit log survived the restructure intact. One consequence worth flagging: the assignment asks for two separate repo links (frontend + backend); with one shared repo, both links in the submission will point to the same URL with a note about which subfolder is which — a reasonable reading of that requirement, not a hard violation, but a deliberate deviation worth having on record.

`backend/.env` and `frontend/.env.local` hold real local secrets (Atlas URI, JWT secret, seeded admin password, API URL) — gitignored, never committed. Each app's `.env.example` documents its variables with placeholders.

## Status: Phase 10 of 15 complete — full patient CRUD across both entry points

| Phase | What | Status |
|---|---|---|
| 1 | Backend project setup (Express + TS scaffold, `/health`, DB connectivity) | ✅ Done |
| 2 | Mongoose models (User/Doctor/Patient) + indexes + seed script | ✅ Done |
| 3 | Auth backend (login/logout/me, JWT httpOnly cookie, rate limiting) | ✅ Done |
| 4 | Doctors API | ✅ Done |
| 5 | Patients API | ✅ Done |
| 6 | Dashboard API | ✅ Done |
| 7 | Frontend foundation + auth | ✅ Done |
| 8 | Doctors UI | ✅ Done |
| 9 | Doctor detail + patient add/delete | ✅ Done |
| 10 | Global Patients page | ✅ Done |
| 11 | Dashboard UI | Not started |
| 12 | Performance & re-render verification pass | Not started |
| 13 | Testing | Not started |
| 14 | Deployment | Not started |
| 15 | README / final polish | Not started |

## What's been built so far

**Phase 1 — Backend project setup**
- `backend/`: Express + TypeScript scaffold, `src/config/env.ts` (Zod-validated env), `src/config/db.ts` (Mongoose connection, fails loudly on bad URI), `src/app.ts` + `src/server.ts`, `GET /health`.
- Verified: server boots, `/health` → 200, bad `MONGODB_URI` → clear error + exit(1), not a hang.
- Note: this machine's local DNS can't resolve `mongodb+srv://` SRV records (network quirk, not an Atlas/code issue) — local `.env` uses the standard non-SRV connection string instead. `.env.example` still documents the normal `mongodb+srv://` form.
- Commit: `Set up backend project structure`.

**Phase 2 — Models, indexes, seed script**
- `src/models/{User,Doctor,Patient}.ts` with all indexes from the plan's §4 table.
- `src/scripts/seed.ts` (`npm run seed`): 1 admin user, 12 doctors, 80 patients, realistic backdated `createdAt` spread (doctors over 180 days, patients over 90 days, biased recent) for date-filter/trend-chart testing.
- Verified against the live Atlas DB: all indexes present via `getIndexes()`, counts match, dates genuinely spread, re-running the seed is idempotent (drops and repopulates, no duplicates/errors).
- Commit: `Add MongoDB models and seed script`.

**Phase 3 — Authentication backend**
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- JWT (2h expiry) in an httpOnly cookie; `requireAuth` middleware protects `logout`/`me`; `express-rate-limit` on login (5/15min/IP); `helmet`, CORS (credentials + exact `FRONTEND_URL` origin), centralized error middleware (`{ error: { message, code } }`), Zod request validation.
- Verified end-to-end with curl: wrong password → generic 401; correct login → 200 + `Set-Cookie`; `/me` with cookie → 200, without → 401; logout clears the cookie and `/me` 401s again; 6th rapid login attempt → 429. Also confirmed cookie flags switch correctly between dev (`HttpOnly; SameSite=Lax`) and `NODE_ENV=production` (`HttpOnly; Secure; SameSite=None`).
- Commit: `Add authentication flow`.

**Phase 4 — Doctors API**
- `GET/POST /api/doctors`, `GET /api/doctors/:id`, `GET/POST /api/doctors/:id/patients` — all behind `requireAuth`.
- `DoctorService.ts` (doctor queries) + a first slice of `PatientService.ts` (`listByDoctor`, `createForDoctor` — full patient CRUD comes in Phase 5).
- Added `src/utils/pagination.ts`, `src/validators/common.ts` (shared `objectId`/pagination/date-range schemas), `src/validators/doctor.validators.ts`.
- Fixed a real bug found while testing: Zod validation errors were reporting `{"body":["Required"]}` instead of naming the actual field, because `flatten().fieldErrors` only looks at the outer `{body,query,params}` wrapper key. `validate.middleware.ts` now walks `err.issues` directly and strips that wrapper segment, so a missing `email` now correctly reports `{"email":["Required"]}`.
- Verified against the live seeded DB: create (success/400 missing-field/409 duplicate-email), list with search/specialization-filter/date-range-filter/pagination individually and all combined, doctor detail (found/404/400-malformed-id), doctor-scoped patient list + create (correctly scoped, 404 under a nonexistent doctor), every route 401s without the auth cookie.
- Ran `explain("executionStats")` for all 5 doctor query patterns from the plan's §7 table: text search uses the text index (no `COLLSCAN`), specialization/date filters use their single-field indexes, the combined search+filter+date query uses the text index plus an in-memory filter for the rest (documented as expected, not a full index-covered plan), and default pagination's `IXSCAN` on `{createdAt:-1}` covers the sort with no separate `SORT` stage.
- Commit: `Add doctor management API`.

**Phase 5 — Patients API**
- `GET /api/patients` (global list: search, condition filter, doctorId filter, date-range filter, pagination), `PATCH /api/patients/:id` (partial update, requires at least one field, re-validates the doctor exists if `doctorId` is being changed), `DELETE /api/patients/:id` — all behind `requireAuth`.
- `PatientService.ts` extended with `listAll`, `updateById`, `deleteById` alongside Phase 4's `listByDoctor`/`createForDoctor`.
- Verified against the live seeded DB: create-under-doctor (success/validation failure), global list filters individually, partial update (confirmed only the targeted field changes, empty body correctly rejected, reassigning to a nonexistent doctor 404s), delete (success, re-delete 404s), every route 401s without the auth cookie.
- Ran `explain("executionStats")` for §7 rows 6–9: patient search uses the text index, condition filter uses its single-field index, date filtering uses `{createdAt:-1}` — and critically, row 8 (`doctorId` + pagination, the app's hottest query) shows a **single `IXSCAN` on the compound `{doctorId,createdAt}` index with no separate `SORT` stage**, confirming the index covers both the filter and the sort order together.
- Commit: `Add patient management API`.

**Phase 6 — Dashboard API**
- `GET /api/dashboard/summary?range=30d` — behind `requireAuth`, one HTTP call from the client, backed by 4 independent queries run via `Promise.all` (not one `$facet` pipeline — see the corrected design in the plan's §10).
- Verified against independently-computed numbers (queried the DB directly, outside the API, and compared): `totalDoctors`=12, `totalPatients`=80 matched exactly; `patientsPerDoctor` top-10 counts matched exactly, correctly descending, with doctor names via `$lookup`.
- **Confirmed the specific bug this design fixes:** called the endpoint with `range=30d` and `range=7d` — `totalDoctors`/`totalPatients`/`patientsPerDoctor` were byte-for-byte identical between the two, while `dateTrend`'s sum correctly changed (47 → 14). Also checked the default (no `range` param → 30d) and a malformed `range` (400).
- Ran `explain("executionStats")` on the `dateTrend` pipeline directly: its `$match` stage uses `IXSCAN` on `createdAt_-1` — and turned out to be a fully **covered** index scan (`totalDocsExamined: 0`), even better than the "just not a COLLSCAN" bar the plan set.
- Commit: `Add dashboard analytics endpoint`.

This closes out the entire backend API surface (auth, doctors, patients, dashboard).

**Phase 7 — Frontend foundation + auth**
- `frontend/`: Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui, TanStack Query, react-hook-form + Zod.
- `src/lib/api-client.ts` (fetch wrapper, `credentials:'include'`, unwraps the backend's `{error:{message,code,details}}` shape), `src/lib/auth.tsx` (`AuthProvider`/`useAuth`, backed by a single `useQuery(['auth','me'])` — no hand-rolled state machine), `src/app/providers.tsx` (`QueryClientProvider` + `AuthProvider`).
- `(auth)/login/page.tsx`, `(dashboard)/layout.tsx` (client-side `<AuthGuard>` — UX only, not a security boundary), `(dashboard)/dashboard/page.tsx` (placeholder, just shows the logged-in email + a logout button), `/` redirects to `/dashboard`.
- No `middleware.ts` — confirmed deliberately absent, per §6's finding that Next.js middleware can never see a cookie the backend set on its own (different) domain.
- **Verified through an actual browser** (not just curl) against both servers running locally: logged-out visit to `/dashboard` → redirected to `/login`; wrong credentials → inline error, stayed on `/login`; correct credentials → landed on `/dashboard` showing the email; hard refresh on `/dashboard` → session survived (cookie round-tripped cross-port); logout → redirected, and a subsequent refresh of `/dashboard` redirected again (server-side session actually cleared, not just client state). Also confirmed `document.cookie` can't read the auth cookie at all (blocked), and `/auth/me` succeeds as a genuine cross-origin request to `localhost:4000` — both consistent with the cookie being scoped to the backend, not the frontend. No console errors during the whole flow.
- **Git restructure this phase:** moved from two independent repos to one shared repo (`backend/` + `frontend/` subfolders, mirrored on GitHub) per your explicit direction — see the workspace-layout note above for how backend's history was preserved through that move, and the tradeoff on the assignment's two-repo-link ask.
- Commit: `Set up frontend project structure and auth flow`.

**Phase 8 — Doctors UI**
- Shared components built against their first real use case (not speculatively): `components/data-table/{DataTable,Pagination}.tsx` (generic, typed by column config — loading skeleton via shadcn `Skeleton`, error state with Retry, distinct empty-state slot), `components/filters/{SearchInput,DateRangeFilter,FilterBar}.tsx` (`SearchInput` debounced 300ms), `components/ui/modal.tsx` (shadcn `Dialog` wrapper), `hooks/useDoctors.ts` (TanStack Query, `keepPreviousData` so the table doesn't flash empty between pages/filters).
- `components/doctors/{DoctorForm,DoctorTable}.tsx`, `(dashboard)/doctors/page.tsx` — filters/page are mirrored into the URL via `useSearchParams`/`router.replace`, wrapped in a `<Suspense>` boundary per Next.js 16's guidance for that hook.
- Added a minimal `NavBar` (Dashboard/Doctors links, Patients to follow in Phase 10) to `(dashboard)/layout.tsx` — needed the moment a second real page existed.
- **Verified live** (backend + frontend both running, driven through an actual browser): search, specialization filter, date-range filter, and pagination all work individually and combined; URL reflects filter/page state and survives a real navigation/refresh; add-doctor client-side validation messages match the backend's Zod messages exactly (checked field-by-field); the filtered-empty state ("No doctors found — try adjusting filters") renders correctly live. The true "no doctors at all" onboarding-empty branch was **not** independently re-verified against a live empty database — doing so would have required deleting all seeded doctors, which the session's safety guard correctly blocked as a destructive action; it's the same ternary as the verified branch, just the opposite condition, so confidence there rests on code review, not a live check — flagged here rather than glossed over.
- **Real bug found and fixed during verification:** killing the backend didn't show a graceful error — it redirected straight to `/login`, because `AuthProvider` treated *any* failed `/auth/me` call (including "server unreachable") as "unauthenticated." Added a distinct `network-error` status (keyed off the API client's status-0 error) so the dashboard shell now shows "Could not reach server" with a Retry button instead of a misleading logged-out redirect. Re-verified live: killed the backend, confirmed the new error state, restarted the backend, confirmed Retry recovers the full page.
- Commit: `Build doctor listing page`.

**Phase 9 — Doctor detail + patient add/delete**
- `(dashboard)/doctors/[id]/page.tsx` — doctor header card, scoped/paginated patient table, Add Patient modal, per-row Delete with confirmation.
- `hooks/usePatients.ts` (`usePatientsByDoctor`, `useCreatePatientForDoctor`, `useDeletePatient`), `components/patients/PatientForm.tsx` (first use — deliberately create-only; edit + doctor reassignment is different enough to get its own form in Phase 10 rather than an unused "mode" prop now), `components/ui/confirm-dialog.tsx` (shadcn `AlertDialog` wrapper, reused for every future delete). `useDoctor(id)` added to `useDoctors.ts` for the header. `DoctorTable` now links doctor names to this page (deferred from Phase 8 on purpose, since the page didn't exist yet).
- Delete/create mutations already invalidate a `["dashboard"]` query key that doesn't exist until Phase 11 — a harmless no-op today, and means dashboard counts will already be correctly wired to refresh once that page lands.
- **Verified live:** opened two different doctors and confirmed completely disjoint patient lists (no cross-doctor leakage); added a patient and watched it appear in the list with no manual refresh (cache invalidation working); delete — tested Cancel (patient stays) and confirmed delete (patient removed, dialog names the correct patient); failed add (empty name/condition) left the modal open with already-entered fields intact.
- Not independently re-verified: whether the dashboard's counts actually reflect these invalidations — there's no dashboard yet, so this is explicitly deferred to Phase 11 per the plan, not skipped.
- Commit: `Add doctor detail page with patient management`.

**Phase 10 — Global Patients page**
- `(dashboard)/patients/page.tsx` — search, condition filter, doctor filter, date-range filter (all URL-synced, same pattern as Doctors), edit modal with doctor reassignment, delete with confirmation. `components/patients/{PatientTable,PatientEditForm}.tsx`. `usePatients.ts` extended with `usePatients` (global list), `useUpdatePatient`. Nav bar now links Patients too.
- **Two real bugs found and fixed during verification, both pre-existing since Phase 8, just not yet triggered:**
  1. Requested `limit=100` for the doctor-name lookup, but the backend hard-caps `limit` at 50 — that request silently 400'd, so the Doctor column showed "—" for every row. Fixed by using `limit=50` (comfortably above the 12 seeded doctors) with a comment explaining why not to raise it casually.
  2. This shadcn version wraps **Base UI's** Select (not Radix), and Base UI's `Select.Value` does **not** auto-derive label text from the selected item the way Radix's does — it shows the raw value string unless given a function-as-children mapping. Every filter select in the app (including Phase 8's specialization filter) was showing literal values like `"all"` instead of "All specializations". Fixed all four instances (doctors specialization filter, patients condition/doctor filters, patient-edit doctor reassignment) with explicit label-mapping functions.
- **Verified:** search, condition filter, doctor filter — individually and combined (live, in-browser). Date-range filtering confirmed at the API level (same `DateRangeFilter` component already proven working in Phase 8's UI). Doctor reassignment verified functionally via direct API calls mirroring the UI's mutation path: patient removed from the old doctor's list, appeared in the new doctor's list, both immediately — exactly the "on next visit" behavior the plan calls for. Edit modal confirmed rendering correctly pre-filled with resolved doctor name. Delete confirmed sharing the exact same `ConfirmDialog`/`useDeletePatient` code path already verified live in Phase 9, so consistency between the two entry points is structural, not coincidental.
- Commit: `Add patient search and filters`.

## Architecture decisions locked in so far

- Two fully separate apps/repos (`backend/`, `frontend/`), not a monorepo — per PDF wording + the assignment email's two-repo deliverable, and per your explicit correction on the git structure.
- Backend is the *only* auth boundary (§6 of the plan) — no Next.js middleware reads the auth cookie, since it's cross-domain and httpOnly. Frontend will only ever know auth state by calling `GET /auth/me`.
- Dashboard totals will be computed as independent parallel queries (`Promise.all`), not one `$facet` pipeline — avoids the date-range bug from the plan's earlier draft and lets the trend query actually use its index.
