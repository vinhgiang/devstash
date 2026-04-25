# Current Feature

<!-- Feature Name -->

Dashboard UI — Phase 1

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

Phase 1 of 3 for the dashboard UI layout. See `@context/features/dashboard-phase-1-spec.md` and reference screenshot `@context/screenshots/dashboard-ui-main.png`.

- ShadCN UI initialization and components
- ShadCN component installation
- Dashboard route at `/dashboard`
- Main dashboard layout and any global styles
- Dark mode by default
- Top bar with search and new item button (display only)
- Placeholder for the sidebar and main area — just an `h2` with "Sidebar" and "Main" for now

## Notes

<!-- Any extra notes -->

- Mock data source of truth: `@src/lib/mock-data.ts`
- Follow-up phases: `@context/features/dashboard-phase-2-spec.md`, `@context/features/dashboard-phase-3-spec.md`

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
