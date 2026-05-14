# Current Feature

<!-- Add feature name here when active -->

## Status

Not Started

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details from spec -->

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Initial Next.js setup: Next.js 16.2.4 with React 19.2.4, TypeScript, ESLint 9, Tailwind CSS v4 (via `@tailwindcss/postcss`), App Router scaffolding in `src/app/` (`layout.tsx`, `page.tsx`, `globals.css`)
- Added `src/lib/mock-data.ts` as single source of truth for dashboard UI until DB is wired up
- Started Dashboard UI Phase 1
- Initialized ShadCN UI (added `button`, `input`); set dark mode as default in root layout
- Created `/dashboard` route with:
  - Left sidebar with DevStash logo (Package icon + text)
  - Top header with sidebar toggle, search input, New Collection + New Item buttons
  - Main content area placeholder
  - Sidebar and Main h2 placeholders for phase 2/3
- Verified build passes
- Completed Dashboard UI Phase 2:
  - Collapsible sidebar on desktop (PanelLeft toggle, smooth width transition)
  - Mobile drawer (slide-in overlay with backdrop, always drawer below lg breakpoint)
  - Types section with colored icons and item counts, each linking to `/items/[type]`
  - Collections section with Favorites subsection (starred) and All Collections subsection (with counts)
  - User avatar area at the bottom (initials, name, email, settings icon)
  - Extracted `AppSidebar` and `DashboardShell` into `src/components/layout/`
- Completed Dashboard UI Phase 3:
  - 4 stats cards (Total Items, Collections, Favorite Items, Favorite Collections) derived from mock data
  - Recent Collections grid with collection cards showing name, item count, description, type icons, and favorite star
  - Pinned Items section with full item cards showing type icon, title, date, description, and tags
  - 10 Recent Items list (compact rows) sorted by createdAt descending
  - Created `src/components/dashboard/StatsCards.tsx`, `RecentCollections.tsx`, `PinnedItems.tsx`, `RecentItems.tsx`
  - Dashboard page computes all derived data as a server component and passes props to section components
- Completed Prisma + Neon PostgreSQL Setup:
  - Installed `prisma@7`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `dotenv`, `server-only`, `tsx`
  - Created `prisma/schema.prisma` with full data model (User, Item, ItemType, Collection, ItemCollection, Tag, NextAuth models) using Prisma 7 conventions: `provider = "prisma-client"`, explicit `output = "../src/lib/generated/prisma"`, no `url` in datasource
  - Created `prisma.config.ts` at project root: schema path, migrations path, seed command (`tsx prisma/seed.ts`), and `DATABASE_URL` via `env()`
  - Created `src/lib/prisma.ts`: singleton PrismaClient with `PrismaPg` driver adapter, `server-only` guard, global instance for dev hot-reload
  - Created `prisma/seed.ts`: upserts all 7 system item types
  - Created `.env.example` with DATABASE_URL placeholder
  - Updated `.gitignore`: added `!.env.example` and `/src/lib/generated/`
  - Ran `npx prisma migrate dev --name init` and `npx prisma db seed` to apply schema and seed system types
- Completed Seed Data:
  - Installed `bcryptjs` for password hashing
  - Rewrote `prisma/seed.ts` to seed demo user (`demo@devstash.io`), 7 system item types, 5 collections, and 18 items across all major types
  - Seed is idempotent: system types use `findFirst + create`, collections and items use `upsert` with stable `seed-` prefixed IDs
  - Fixed Postgres NULL uniqueness issue (NULL != NULL in unique indexes) that caused duplicate system types on repeated seed runs
  - Added `scripts/test-db.ts` to verify connection, type count, and table row counts
- Completed Dashboard Collections - Wire up real DB data:
  - Created `src/lib/db/collections.ts` with `getRecentCollections` and `getCollectionStats` functions
  - `getRecentCollections` fetches collections with item counts, type icons, and derives `borderColor` from the most-used content type in each collection
  - `getCollectionStats` returns total and favorite collection counts for the stats cards
  - Updated `src/app/dashboard/page.tsx` to resolve demo user by email, fetch real data via `Promise.all`, and pass it to components
  - Updated `RecentCollections` to accept `borderColor` prop and apply it as a left border accent via inline style
- Completed Stats & Sidebar - Wire up real DB data:
  - Created `src/lib/db/items.ts` with `getItemStats`, `getSystemItemTypesWithCounts`, `getPinnedItems`, `getRecentItems`
  - Added `getSidebarCollections` to `src/lib/db/collections.ts` — returns all collections with `dotColor` (most-used item type color) for sidebar colored circles
  - Updated `AppSidebar` to accept `itemTypes` and `collections` as props; types link to `/items/[name]`; recents section shows colored dot instead of count; "View all collections" link added
  - Updated `DashboardShell` to accept and forward `sidebarData` props to both sidebar instances
  - Updated `dashboard/page.tsx` to fetch all data from DB — stats, pinned items, recent items, sidebar types and collections all wired to real data
- Completed Add Pro Badge to Sidebar:
  - Added ShadCN `Badge` component (`src/components/ui/badge.tsx`) via `npx shadcn add badge`
  - Updated `AppSidebar` to render a subtle `outline` variant PRO badge inline on the `file` and `image` type rows, between the label and item count
  - Badge styled with `h-4 text-[9px] text-muted-foreground border-muted-foreground/30` to keep it unobtrusive
- Completed Code Quality Quick Wins (codebase audit fixes):
  - Added `take: 20` limit to `getPinnedItems` to prevent unbounded DB reads
  - Fixed `getRecentItems` to include and map real tags instead of returning `[]`
  - Extracted `ICON_COMPONENTS` to `src/lib/constants/item-types.ts`; removed 4 duplicate copies across dashboard and sidebar components
  - Fixed array index React key on type icons in `RecentCollections` (now uses icon name)
  - Added `DATABASE_URL` runtime guard in `src/lib/prisma.ts` with a readable startup error
  - Replaced root route placeholder with `redirect('/dashboard')`
  - Added missing DB indexes: `item_collections.collectionId`, `sessions.userId`, `accounts.userId` via migration `20260430075717_add_missing_indexes`
  - Resolved sidebar user from DB, removed last `mock-data.ts` dependency (file deleted)
  - Extracted `deriveTypeAccents` helper in `collections.ts`; added `TYPE_SAMPLE_LIMIT = 50` cap on item sub-queries; used `_count` for accurate item counts
  - Added fail-fast guard in dashboard page when demo user is missing
- Completed Auth Phase 1 - NextAuth v5 + GitHub Provider:
  - Installed `next-auth@5.0.0-beta.31` and `@auth/prisma-adapter@2.11.2`
  - Created `src/auth.config.ts` (edge-compatible providers config — GitHub only)
  - Created `src/auth.ts` with `PrismaAdapter`, `session: { strategy: "jwt" }`, and `jwt`/`session` callbacks to surface `user.id` on the session
  - Created `src/app/api/auth/[...nextauth]/route.ts` exporting `GET`/`POST` from `handlers`
  - Created `src/proxy.ts` (Next.js 16 proxy convention) wrapping `auth()` from edge config; matcher `/dashboard/:path*`; redirects unauthenticated requests to `/api/auth/signin?callbackUrl=...`
  - Created `src/types/next-auth.d.ts` augmenting Session and JWT with `user.id`
  - Updated `.env.example` with `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
  - Verified end-to-end via Playwright: `/dashboard` → 307 → `/api/auth/signin` rendering "Sign in with GitHub" button
  - Note: `next dev` (Turbopack) requires a clean `.next` cache when adding `proxy.ts` for the first time; otherwise the middleware manifest stays empty and the proxy doesn't fire
- Completed Auth Phase 2 - Credentials (Email/Password):
  - Added Credentials provider placeholder in `src/auth.config.ts` (`authorize: async () => null`) so the proxy/edge config stays free of bcrypt/prisma imports
  - Overrode `providers` in `src/auth.ts` to bind the real Credentials provider with bcrypt validation; introduced `InvalidCredentialsError extends CredentialsSignin` (code `invalid_credentials`)
  - Added constant-time guard against email enumeration: precompute `DUMMY_HASH` at module load and always run `bcrypt.compare` against the user's hash or the dummy
  - Created `POST /api/auth/register` (`src/app/api/auth/register/route.ts`): validates email regex + password ≥8 chars + match, normalizes email to lowercase, returns 409 on duplicate, hashes with bcrypt(10), creates user
  - Switched from baking `trustHost: true` into the config to env-driven: documented `AUTH_TRUST_HOST` in `.env.example` (set only when self-hosting outside Vercel/Netlify/Cloudflare); set `AUTH_TRUST_HOST=true` in local `.env` for `npm run start`
  - Verified end-to-end: register (400 mismatched, 201 valid, 409 duplicate); credentials sign-in (302 → `/dashboard` valid, 302 → `/api/auth/signin?error=CredentialsSignin&code=invalid_credentials` invalid); proxy still 307s unauthenticated `/dashboard`; signin page lists both GitHub and email/password
- Completed Auth Phase 3 - Custom Auth UI + Sidebar User Dropdown:
  - Created `/sign-in` page (`src/app/sign-in/page.tsx`): email/password form with client-side error display, "Sign in with GitHub" button (inline SVG icon), link to `/register`; wrapped in `<Suspense>` for `useSearchParams` compatibility
  - Created `/register` page (`src/app/register/page.tsx`): name/email/password/confirm fields, client-side validation before POST to `/api/auth/register`, redirects to `/sign-in` on success
  - Added `pages: { signIn: '/sign-in' }` to `src/auth.ts` so NextAuth uses custom pages for all sign-in redirects (including from `proxy.ts`)
  - Created `src/components/shared/UserAvatar.tsx`: renders `next/image` with GitHub avatar if `image` is set, otherwise shows a colored initials circle (up to 2 chars)
  - Added `avatars.githubusercontent.com` to `next.config.ts` `images.remotePatterns` for GitHub profile photos
  - Added shadcn `dropdown-menu` component (backed by `@base-ui/react/menu`)
  - Replaced sidebar user area static layout with a `DropdownMenu` trigger: clicking opens upward dropdown with "Profile" (→ `/profile`) and "Sign out" (destructive, calls `signOut({ callbackUrl: '/sign-in' })`)
  - Updated `dashboard/page.tsx` to call `auth()` and use real session user ID for all DB queries — hard-coded demo user lookup removed
  - Added `.playwright-mcp/` to `.gitignore`
- Completed Email Verification on Register (Resend):
  - Installed `resend` and `@react-email/components`
  - Added `EMAIL_FROM` and `NEXT_PUBLIC_APP_URL` to `.env.example` with dev-mode guidance (Resend's `onboarding@resend.dev` only delivers to the account owner)
  - Created `src/lib/resend.ts` with a lazy `getResend()` singleton (avoids throwing during `next build` when env isn't loaded)
  - Created `src/lib/auth/verification-token.ts` with `createVerificationToken` (32-byte hex, 24h TTL, deletes any prior token for the email), `consumeVerificationToken` (read + delete + expiry check), and `buildVerifyUrl`
  - Created `src/emails/VerificationEmail.tsx` using `@react-email/components` (Body/Container/Heading/Button/Hr) with inline-style objects; passed via Resend's `react` field so HTML and plain-text are rendered automatically
  - Created `src/lib/email/verification.ts` wrapping `getResend().emails.send({ react: VerificationEmail({ ... }) })`
  - Updated `POST /api/auth/register` to create the token and send the email after user creation; returns 500 with a friendly message if the send fails (logged to console for diagnosis)
  - Created `GET /api/auth/verify?token=...` route that consumes the token, sets `User.emailVerified`, and redirects to `/sign-in?verified=1` (or `?error=verify_expired|verify_invalid`)
  - Added `EmailNotVerifiedError extends CredentialsSignin` (code `email_not_verified`); `authorize` in `src/auth.ts` now rejects users with `emailVerified === null`
  - Added `events.linkAccount` in `src/auth.ts` to auto-set `emailVerified` for OAuth signups (GitHub stays trusted)
  - Refactored sign-in toast/error logic into `src/app/sign-in/use-sign-in-toasts.ts` — `QUERY_TOASTS` data table maps `?registered=1`, `?verified=1`, `?error=verify_*` to toast kind/message; `SIGN_IN_ERROR_MESSAGES` map handles credentials error codes; adding new scenarios is a single entry in the table
  - Updated `/register` card description to mention the verification email
  - Added `scripts/cleanup-users.ts` and `db:cleanup` npm script: dry-run preview by default, deletes all non-demo users (and their cascaded items, collections, accounts, sessions, custom item types) plus their verification tokens (which don't cascade) when `--yes` is passed
  - Added `db:test` and `db:cleanup` scripts to `package.json`
- Completed Email Verification Toggle:
  - Added `src/lib/auth/config.ts` exporting `EMAIL_VERIFICATION_REQUIRED` (true unless `REQUIRE_EMAIL_VERIFICATION=false`)
  - `src/auth.ts`: `authorize` skips `EmailNotVerifiedError` when flag is off, so users with `emailVerified === null` can sign in
  - `src/app/api/auth/register/route.ts`: wraps token creation + Resend call in `if (EMAIL_VERIFICATION_REQUIRED)`; returns `verificationSent: boolean` in the 201 body
  - `src/app/register/page.tsx`: reads `verificationSent` from the 201 response and redirects to `?registered=1` (check email) or `?registered_direct=1` (sign in directly); removed verification mention from `CardDescription`
  - `src/app/sign-in/use-sign-in-toasts.ts`: added `registered_direct=1` toast entry — "Account created. You can now sign in."
  - `.env.example`: documented `REQUIRE_EMAIL_VERIFICATION=false` with usage note
- Completed Forgot Password Flow:
  - Added password reset token helpers to `src/lib/auth/verification-token.ts`: `createPasswordResetToken`, `consumePasswordResetToken`, `buildPasswordResetUrl` using `reset:` identifier prefix to distinguish from email-verification tokens
  - Created `src/emails/ResetPasswordEmail.tsx` React Email component with 24h TTL reset link
  - Created `src/lib/email/reset-password.ts` email sender wrapper via Resend
  - Created `POST /api/auth/forgot-password`: looks up user, prevents enumeration by always returning same 200 response, rejects OAuth-only accounts (no `password` field), sends reset email
  - Created `POST /api/auth/reset-password`: validates token via `consumePasswordResetToken`, hashes new password with bcrypt(10), updates user, deletes token, returns error codes for `reset_expired` and `reset_invalid`
  - Created `/forgot-password` page: email form with submit-then-hide pattern, shows "check your inbox" regardless of outcome
  - Created `/reset-password?token=...` page: client component with Suspense wrapper, validates token presence, shows inline error links to request new reset link, redirects to `/sign-in?password_reset=1` on success
  - Added "Forgot password?" link to `/sign-in` page below password field
  - Added `password_reset=1` success toast to sign-in toast table
  - Refactored all four auth pages into `src/app/(auth)/` route group with shared `layout.tsx` (centered container + DevStash logo), eliminating 44 lines of duplication across sign-in, register, forgot-password, reset-password pages
  - Build verified clean with all routes correctly registered
- Completed Profile Page:
  - Added `shadcn` `dialog` and `label` components
  - Extended proxy matcher in `src/proxy.ts` to cover `/profile` and `/profile/:path*`
  - Added `ProfileUser` interface and `getProfileUser` helper to `src/lib/db/items.ts` (fetches `createdAt` and `hasPassword` — fields not in the session)
  - Created `POST /api/profile/change-password`: validates current password via bcrypt, hashes new password with bcrypt(10), requires auth
  - Created `DELETE /api/profile`: cleans up `VerificationToken` rows (not cascade-deleted) then deletes the user, cascading all items/collections/accounts/sessions
  - Created `src/components/profile/ChangePasswordForm.tsx`: client form with current/new/confirm fields; client-side length and match validation before POST
  - Created `src/components/profile/DeleteAccountDialog.tsx`: base-ui dialog using `render` prop on `DialogTrigger`; calls DELETE then `signOut` on success
  - Created `src/app/profile/page.tsx`: server component wrapped in `DashboardShell`; fetches profile user, item stats, collection stats, type breakdown, and sidebar data in parallel via `Promise.all`; renders Account info (avatar, name, email, member since), Usage stats (totals + per-type breakdown with icons), Change Password card (credentials users only, hidden for GitHub OAuth), and Danger Zone
- Completed Rate Limiting for Auth:
  - Installed `@upstash/ratelimit` and `@upstash/redis`
  - Created `src/lib/rate-limit.ts` with named limiter configs (login, register, forgotPassword, resetPassword, resendVerification), sliding-window algorithm, lazy Redis singleton, fail-open behavior when Upstash env vars are missing or the call throws
  - Helpers: `checkRateLimit(name, key)` returns `{ success, remaining, reset, limit, retryAfterSeconds }`; `getClientIp(req)` reads `x-forwarded-for`/`x-real-ip` with `"anonymous"` fallback; `rateLimitResponse(result)` builds a 429 JSON response with `Retry-After` + `X-RateLimit-*` headers; `rateLimitMessage(seconds)` formats a friendly minute-precision message
  - Wired limits into all four auth endpoints: `register` (3/hour by IP), `forgot-password` (3/hour by IP), `reset-password` (5/15min by IP), and Credentials `authorize` in `src/auth.ts` (5/15min by IP+email)
  - Added `RateLimitedError extends CredentialsSignin` (code `rate_limited`) — `authorize` now accepts NextAuth's `request` argument to extract the IP
  - Surfaced 429s on the frontend: `/forgot-password` page renders inline destructive banner with the server's error message; `use-sign-in-toasts.ts` maps `rate_limited` to "Too many sign-in attempts. Please wait a few minutes before trying again."
