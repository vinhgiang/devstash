# Item Types

> Reference doc for the 7 system item types in DevStash. Each item in the app belongs to exactly one type, which controls its icon, accent color, default content storage, and the dedicated `/items/[name]` listing route.

---

## At a Glance

| Type    | Icon (Lucide) | Hex Color | Content Class | Tier      | Route             |
| ------- | ------------- | --------- | ------------- | --------- | ----------------- |
| snippet | `Code`        | `#3b82f6` | TEXT          | Free      | `/items/snippet`  |
| prompt  | `Sparkles`    | `#8b5cf6` | TEXT          | Free      | `/items/prompt`   |
| command | `Terminal`    | `#f97316` | TEXT          | Free      | `/items/command`  |
| note    | `StickyNote`  | `#fde047` | TEXT          | Free      | `/items/note`     |
| link    | `Link` (`Link2`) | `#10b981` | URL        | Free      | `/items/link`     |
| file    | `File`        | `#6b7280` | FILE          | Pro only  | `/items/file`     |
| image   | `Image`       | `#ec4899` | FILE          | Pro only  | `/items/image`    |

Color tokens are duplicated in three places that must stay in sync:

- `prisma/seed.ts` — `systemItemTypes[]` (seeds DB `item_types.color`)
- `src/lib/constants/item-types.ts` — `ITEM_TYPE_COLORS` (UI accents)
- `context/project-overview.md` — CSS variable list `--color-*`

The Lucide icon name lives in the DB as a string (`ItemType.icon`); the runtime mapping is in `ICON_COMPONENTS` (`src/lib/constants/item-types.ts`). Note: the seed/DB stores `"Link"`, but the constants file maps that key to the `Link2` Lucide component.

---

## Per-Type Detail

### snippet — `#3b82f6` (blue) — `Code`

Reusable code blocks. Most common type in seed data (4 of 18 items).

- **Purpose:** Store code patterns, hooks, utilities, boilerplates with syntax highlighting.
- **Content class:** TEXT (`contentType: "TEXT"`).
- **Key fields:** `content` (the code, `@db.Text`), `language` (string, drives syntax highlighting — e.g. `"typescript"`, `"dockerfile"`).
- **Seed examples:** `useDebounce`/`useLocalStorage` hook bundle, compound-component Tabs, `cn`/`formatDate` utilities, multi-stage Next.js Dockerfile.

### prompt — `#8b5cf6` (purple) — `Sparkles`

LLM prompts and AI workflow templates.

- **Purpose:** Save AI prompts (code review, doc generation, refactor assistance) for reuse with `[PASTE CODE HERE]`-style placeholders.
- **Content class:** TEXT.
- **Key fields:** `content` (the prompt body). `language` typically unset — prompts are prose, not code.
- **Seed examples:** Code Review Prompt, Documentation Generation Prompt, Refactoring Assistance Prompt.

### command — `#f97316` (orange) — `Terminal`

Shell commands and CLI recipes.

- **Purpose:** One-line or multi-line shell commands worth keeping handy (git, docker, npm, process management).
- **Content class:** TEXT.
- **Key fields:** `content` (the command(s); often a multi-line shell script with `#` comments). `language` typically unset, but could be `"bash"` if syntax highlighting is desired.
- **Seed examples:** Git undo/clean recipes, Docker prune/exec/logs, port-killing & PID lookups, npm audit/dedupe.

### note — `#fde047` (yellow) — `StickyNote`

Freeform markdown notes.

- **Purpose:** Catch-all for prose, meeting notes, course notes, explanations — anything that isn't code, prompt, or command but is still text.
- **Content class:** TEXT.
- **Key fields:** `content` (markdown). `language` typically unset.
- **Seed examples:** _None in current seed_; rendered via markdown editor per spec.

### link — `#10b981` (emerald) — `Link` (rendered with `Link2`)

External URLs / bookmarks.

- **Purpose:** Documentation links, tools, references — anything web-addressable.
- **Content class:** URL (`contentType: "URL"`).
- **Key fields:** `url` (the destination). `content`, `language`, and file fields are unused. `description` can hold context. `title` becomes the visible label.
- **Seed examples:** GitHub Actions docs, Docker docs, Tailwind CSS docs, shadcn/ui, Radix UI, Lucide icons.

### file — `#6b7280` (gray) — `File` — **Pro only**

Arbitrary file uploads stored in Cloudflare R2.

- **Purpose:** Context files, templates, PDFs, configs, any binary or text file the user wants to keep.
- **Content class:** FILE (`contentType: "FILE"`).
- **Key fields:** `fileUrl` (R2 object URL), `fileName` (original upload name), `fileSize` (bytes). `content` and `url` unused.
- **Tier:** Pro-gated (see `context/project-overview.md` Monetization). No file items in the current seed.

### image — `#ec4899` (pink) — `Image` — **Pro only**

Image uploads (screenshots, diagrams, references).

- **Purpose:** Visual assets stored alongside other knowledge — pasted screenshots, design mocks, diagrams.
- **Content class:** FILE.
- **Key fields:** Same as `file` — `fileUrl`, `fileName`, `fileSize`. The distinction from `file` is semantic/UI (gallery rendering vs. file row), not schema-level.
- **Tier:** Pro-gated. No image items in the current seed.

---

## Content Class Summary

The `Item.contentType` enum (`ContentType { TEXT, FILE, URL }`, `prisma/schema.prisma:83-87`) splits the seven types into three storage shapes:

| Class | Types                            | Storage fields used                         | Storage fields unused                |
| ----- | -------------------------------- | ------------------------------------------- | ------------------------------------ |
| TEXT  | snippet, prompt, command, note   | `content`, `language` (snippet only, usually) | `fileUrl`, `fileName`, `fileSize`, `url` |
| URL   | link                             | `url`                                       | `content`, `language`, file fields   |
| FILE  | file, image                      | `fileUrl`, `fileName`, `fileSize`           | `content`, `language`, `url`         |

`language` is technically available to every type but is only semantically meaningful for snippets (and possibly commands if treated as `bash`). All other fields (`title`, `description`, `isFavorite`, `isPinned`, tags, collection membership) work identically across all types.

---

## Shared Properties (every type has these)

Defined on `Item` (`prisma/schema.prisma:89-116`):

- `id` (cuid), `title` (required), `description` (optional, `@db.Text`)
- `isFavorite`, `isPinned` (booleans, default false) — drive starred/pinned sections in the dashboard
- `createdAt`, `updatedAt`
- `userId` (owner, cascade delete), `itemTypeId` (FK to `ItemType`)
- `tags` (many-to-many via `ItemTags`)
- `collections` (many-to-many via `ItemCollection` join table, with `addedAt`)

Indexes: `userId`, `itemTypeId`, `createdAt`.

---

## Display Differences

Behavior driven by `contentType` and type identity:

- **Card preview**
  - TEXT types → render `content` (truncated, syntax-highlighted for snippets when `language` is set)
  - URL → render `url` as the clickable preview, `title` as label
  - FILE → render filename + size; image cards show thumbnail
- **Editor / form**
  - TEXT → markdown / code editor for `content`, plus optional `language` selector for snippets
  - URL → single URL input + title/description
  - FILE → upload dropzone writing to R2 (`fileUrl`)
- **Sidebar & dashboard accents** — each type row uses its hex color for the icon and (in collections) the left-border accent / dot is derived from the most-used type in that collection (`deriveTypeAccents` in `src/lib/db/collections.ts`).
- **Pro gating** — `file` and `image` rows in the sidebar render an outlined `PRO` badge (see `src/components/layout/AppSidebar.tsx`).
- **Routing** — every type has a dedicated listing page at `/items/[type-name]` (per project-overview.md table; routes not yet implemented in the codebase as of this snapshot).

---

## System vs. Custom Types

All 7 types ship as `isSystem: true` with `userId: null`, seeded once via `prisma/seed.ts`. The schema allows user-owned custom types (`ItemType.userId` is nullable, `@@unique([name, userId])`), but the current free/pro feature matrix marks "Custom Types" as 🔜 Coming Soon, so custom types are not yet user-creatable in the UI.

`@@unique([name, userId])` lets a user create a custom type sharing a name with a system type (because Postgres treats `NULL != NULL` in unique indexes — this is also why the seed uses `findFirst + create` instead of `upsert` for system types; see comment at `prisma/seed.ts:24`).
