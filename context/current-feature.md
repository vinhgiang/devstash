# Current Feature

<!-- Feature Name -->

Prisma + Neon PostgreSQL Setup

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

- Install and configure Prisma 7 ORM with Neon PostgreSQL (serverless)
- Create initial schema based on data models in `context/project-overview.md`
- Include NextAuth models (Account, Session, VerificationToken)
- Add appropriate indexes and cascade deletes
- Seed system item types

## Notes

- Dev branch is used for `DATABASE_URL`; production is a separate branch
- Always create migrations (`prisma migrate dev`) — never use `prisma db push`
- Using Prisma 7, which has breaking changes — read the upgrade guide before writing any code
- Spec reference: `context/features/database-spec.md`

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
- Started Prisma + Neon PostgreSQL Setup:
  - Installed `prisma@7`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `dotenv`, `server-only`, `tsx`
  - Created `prisma/schema.prisma` with full data model (User, Item, ItemType, Collection, ItemCollection, Tag, NextAuth models) using Prisma 7 conventions: `provider = "prisma-client"`, explicit `output = "../src/lib/generated/prisma"`, no `url` in datasource
  - Created `prisma.config.ts` at project root: schema path, migrations path, seed command (`tsx prisma/seed.ts`), and `DATABASE_URL` via `env()`
  - Created `src/lib/prisma.ts`: singleton PrismaClient with `PrismaPg` driver adapter, `server-only` guard, global instance for dev hot-reload
  - Created `prisma/seed.ts`: upserts all 7 system item types
  - Created `.env.example` with DATABASE_URL placeholder
  - Updated `.gitignore`: added `!.env.example` and `/src/lib/generated/`
  - Next step: add `DATABASE_URL` to `.env`, then run `npx prisma migrate dev --name init` and `npx prisma db seed`
