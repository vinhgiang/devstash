# Current Feature: Auth Credentials - Email/Password Provider

## Status

In Progress

## Goals

- Use bcryptjs (already installed) for password hashing
- Add `password` field to User model via Prisma migration if not already present
- Add Credentials provider placeholder (`authorize: () => null`) in `auth.config.ts`
- Override Credentials provider in `auth.ts` with bcrypt-based validation
- Create `POST /api/auth/register` to handle name/email/password/confirmPassword, validate, hash, and create the user
- Verify email/password sign-in via `/api/auth/signin` redirects to `/dashboard`; GitHub OAuth still works

## Notes

### Split Pattern for Credentials

- `auth.config.ts` — Credentials provider with `authorize: () => null` placeholder (keeps file edge-compatible)
- `auth.ts` — override the Credentials provider with actual bcrypt validation against the DB

### Registration API Route

`POST /api/auth/register`

- Accept: `name`, `email`, `password`, `confirmPassword`
- Validate passwords match
- Check if user already exists
- Hash password with `bcryptjs`
- Create user in database
- Return success/error response

### Testing

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123","confirmPassword":"password123"}'
```

1. Hit the registration endpoint above
2. Go to `/api/auth/signin`
3. Sign in with email/password — verify redirect to `/dashboard`
4. Verify GitHub OAuth still works

### References

- Credentials provider: https://authjs.dev/getting-started/authentication/credentials

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
