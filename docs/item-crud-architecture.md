# Item CRUD Architecture

> A unified design for creating, reading, updating, and deleting items across all 7 system types (snippet, prompt, command, note, link, file, image). One mutation surface, one query surface, one dynamic route, and a small set of polymorphic components that branch on `contentType` rather than on type name.

See also: [docs/item-types.md](./item-types.md) for the per-type field reference. The four storage shapes (TEXT/URL/FILE × pro-gated or not) are the load-bearing variable here — most of this architecture is just routing around them cleanly.

---

## Principles

1. **One server action file** for every item mutation. No per-type action files. Branching on type happens in form components, not in the action layer.
2. **`lib/db/items.ts` for reads.** Server components call query helpers directly — no API routes for normal page rendering.
3. **One dynamic route** `/items/[type]` for listings, one `/items/[type]/[id]` for detail/edit. The `[type]` param is validated against the system type list and feeds the same components.
4. **Polymorphism by `contentType`, not by type name.** `snippet`/`prompt`/`command`/`note` collapse into a single TEXT editor; `link` uses a URL form; `file`/`image` use the upload form. Type identity only changes icon, color, default `language`, and copy.
5. **Server Actions over API routes** for in-app mutations. API routes only for file upload progress (R2) or future external clients (per `context/coding-standards.md`).
6. **Zod at the boundary.** Every action validates input before touching Prisma; every loader's params are validated when they come from URLs.

---

## File Structure

```
src/
├── actions/
│   └── items.ts                    # ALL item mutations (create/update/delete/toggle)
│
├── lib/
│   ├── db/
│   │   ├── items.ts                # Read queries (existing — extend, don't fork)
│   │   └── item-types.ts           # System-type lookups (resolve name → id, validate slug)
│   ├── validation/
│   │   └── items.ts                # Zod schemas shared by actions + forms
│   └── constants/
│       └── item-types.ts           # ICON_COMPONENTS, ITEM_TYPE_COLORS (existing)
│
├── app/
│   └── (dashboard)/
│       └── items/
│           └── [type]/
│               ├── page.tsx        # Listing for one type
│               ├── new/
│               │   └── page.tsx    # Create form (server component → renders ItemForm)
│               └── [id]/
│                   ├── page.tsx    # Read view (renders ItemView)
│                   └── edit/
│                       └── page.tsx # Edit form (renders ItemForm with initialData)
│
├── components/
│   └── items/
│       ├── ItemForm.tsx            # Dispatcher — picks editor by contentType
│       ├── ItemFormShell.tsx       # Shared title/description/tags/collections fields
│       ├── editors/
│       │   ├── TextEditor.tsx      # snippet/prompt/command/note (markdown + optional language)
│       │   ├── UrlEditor.tsx       # link
│       │   └── FileEditor.tsx      # file/image (Pro-gated)
│       ├── ItemCard.tsx            # Grid/list card (reads contentType to choose preview)
│       ├── ItemList.tsx            # Server-rendered list with sort/filter
│       ├── ItemView.tsx            # Read-only renderer (code highlight / link card / image lightbox)
│       ├── ItemActionsMenu.tsx     # Pin/favorite/delete dropdown (client, calls actions)
│       └── DeleteItemDialog.tsx    # Confirmation modal
│
└── types/
    └── item.ts                     # Shared TS interfaces (ItemDTO, ItemFormInput)
```

### Why this shape

- A single `actions/items.ts` keeps the mutation surface scannable and prevents "do I update `snippet.ts` or `note.ts`?" decision fatigue. Type-specific validation lives in Zod discriminated unions, not in separate files.
- Reads stay in `lib/db/items.ts` because Server Components already import from there (`dashboard/page.tsx:8-14`). Extending the same module preserves one cache-tag/revalidation story.
- One route segment (`[type]`) eliminates 7 near-duplicate folders.
- Editors split on `contentType` (3 variants) instead of type name (7 variants). Snippet and note are 99% the same form — only the default `language` and placeholder text differ.

---

## Routing: `/items/[type]`

### Resolution

The `[type]` slug is the `ItemType.name` (`"snippet"`, `"prompt"`, …). On every page entry:

1. Validate slug against the static system list (`SYSTEM_TYPE_NAMES`) — return `notFound()` for anything else.
2. Resolve to `ItemType.id` via `getSystemTypeBySlug(slug)` (memoized — system types are immutable and small).
3. Auth-check via `auth()`; redirect to `/sign-in` if missing.
4. Query items filtered by `userId` + `itemTypeId`.

### Routes

| Path                          | Component             | Purpose                                                 |
| ----------------------------- | --------------------- | ------------------------------------------------------- |
| `/items/[type]`               | `ItemList`            | List all items of this type for the current user        |
| `/items/[type]/new`           | `ItemForm` (create)   | Empty form preconfigured for this type                  |
| `/items/[type]/[id]`          | `ItemView`            | Read-only display (with edit/delete actions)            |
| `/items/[type]/[id]/edit`     | `ItemForm` (edit)     | Pre-populated form                                      |

The `new` and `[id]/edit` pages both render `<ItemForm typeSlug={...} initialData={...} />`. Whether it creates or updates is decided by the presence of `initialData?.id`.

### Why `[type]` instead of one flat `/items` list

- Matches the spec's per-type listings in `context/project-overview.md` (Route column: `/items/snippets`, `/items/prompts`, …).
- Lets the page header, "New {Type}" button copy, and default editor preset themselves cleanly without conditionals scattered across components.
- Sidebar links already point to `/items/[name]` (per the dashboard wiring history).

### Pro-gating

`file` and `image` routes check `session.user.isPro` and redirect to a paywall page if false. The check happens in the route's `page.tsx` (one line), so the form/components stay tier-agnostic.

---

## Mutations: `src/actions/items.ts`

All exports are Server Actions (`'use server'` at file top). Each action follows the project's `{ success, data?, error? }` return pattern (`context/coding-standards.md` → Error Handling).

### Surface

```ts
// All take FormData or a typed object; all return ActionResult<T>.

export async function createItem(input: CreateItemInput): Promise<ActionResult<{ id: string }>>
export async function updateItem(id: string, input: UpdateItemInput): Promise<ActionResult<{ id: string }>>
export async function deleteItem(id: string): Promise<ActionResult>
export async function toggleItemPinned(id: string): Promise<ActionResult<{ isPinned: boolean }>>
export async function toggleItemFavorite(id: string): Promise<ActionResult<{ isFavorite: boolean }>>
export async function setItemCollections(id: string, collectionIds: string[]): Promise<ActionResult>
```

### Shared flow

Every mutation does the same five things in the same order:

1. `const session = await auth()` → reject if no `session.user.id`.
2. Parse with the Zod schema from `lib/validation/items.ts` → reject on validation failure with a flattened error.
3. **Ownership check** — for `update`/`delete`/`toggle*`, `prisma.item.findFirst({ where: { id, userId } })` and bail with `error: 'not_found'` if missing. (Never `findUnique` then compare — that's two round-trips and a TOCTOU.)
4. **Free-tier guard** for create — `if (!user.isPro && contentType === 'FILE') return { success: false, error: 'pro_required' }`; also enforce the 50-item / 3-collection limits via `prisma.item.count`.
5. Prisma write → `revalidatePath('/items/' + typeSlug)` + `revalidatePath('/dashboard')`.

### Input shape (Zod discriminated union)

```ts
// lib/validation/items.ts
const baseFields = {
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).max(20).default([]),
  collectionIds: z.array(z.string().cuid()).default([]),
  isPinned: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
}

export const createItemSchema = z.discriminatedUnion('contentType', [
  z.object({ contentType: z.literal('TEXT'), typeSlug: z.enum(TEXT_TYPES), content: z.string().min(1), language: z.string().optional(), ...baseFields }),
  z.object({ contentType: z.literal('URL'),  typeSlug: z.literal('link'),   url: z.string().url(), ...baseFields }),
  z.object({ contentType: z.literal('FILE'), typeSlug: z.enum(['file', 'image']), fileUrl: z.string().url(), fileName: z.string(), fileSize: z.number().int().positive(), ...baseFields }),
])
```

The discriminated union means **type-specific validation lives in the schema**, not in conditional `if` blocks inside the action. `createItem` just calls `createItemSchema.parse(input)` and the right rules apply.

### What does NOT live here

- Icon / color resolution — those are constants, looked up in components.
- Type-specific UI (markdown vs. URL field vs. dropzone) — entirely client-side concerns.
- File upload — `FILE`-type items expect `fileUrl` to already point at an R2 object. The upload happens via a separate `POST /api/upload` route (needed for streaming progress), then the resulting URL is passed into `createItem`.

---

## Reads: `src/lib/db/items.ts`

Existing functions stay (`getItemStats`, `getSystemItemTypesWithCounts`, `getPinnedItems`, `getRecentItems`). Extend with:

```ts
export async function getItemsByType(userId: string, typeId: string, opts?: { sort?: 'recent' | 'pinned' | 'favorite'; q?: string }): Promise<ItemWithType[]>
export async function getItemById(userId: string, id: string): Promise<ItemDetail | null>
export async function getItemTypeBySlug(slug: string): Promise<{ id: string; name: string; icon: string; color: string } | null>
```

- `getItemsByType` powers the listing page. The `q` param does ILIKE matching against `title`, `content`, `description`, and `tags.name` (per spec: "Search across content, tags, titles, types"). Promote to Postgres FTS later if it becomes slow.
- `getItemById` returns the full record including `tags`, `collections`, and `itemType`. Always scoped by `userId` (the read-side equivalent of the action ownership check).
- `getItemTypeBySlug` is the slug → id resolver; the result is small + immutable enough to wrap in `unstable_cache` if needed.

Server components import these directly. No API route, no `useEffect` fetching, no client-side data plumbing for read paths.

---

## Components and Their Responsibilities

### `ItemForm.tsx` (dispatcher, client component)

Receives `typeSlug` and optional `initialData`. Looks up `contentType` from the slug (TEXT/URL/FILE) and renders:

- `<ItemFormShell>` — title, description, tags, collections, pin/favorite toggles (identical across all types).
- One of `<TextEditor>`, `<UrlEditor>`, `<FileEditor>` slotted into the body.

Submits via the appropriate server action (`createItem` if no `initialData.id`, else `updateItem(id, ...)`). On success, redirects via `router.push(/items/{typeSlug}/{id})` and revalidation handles cache.

### Editors

| Editor          | Renders                                                                | Type slugs              |
| --------------- | ---------------------------------------------------------------------- | ----------------------- |
| `TextEditor`    | Markdown/code editor + optional `language` dropdown (snippet/command only) | snippet, prompt, command, note |
| `UrlEditor`     | URL input with paste-and-preview                                       | link                    |
| `FileEditor`    | Dropzone → `POST /api/upload` → on success, stores returned `fileUrl`  | file, image             |

Editors are dumb — they get `value`/`onChange` and report a typed payload up to `ItemForm`. They never call actions directly.

### `ItemView.tsx` (server component)

Reads-only renderer. Branches on `contentType`:

- TEXT → syntax-highlighted code block (uses `language`) or rendered markdown for `note`/`prompt`.
- URL → titled link card with favicon and `url` preview.
- FILE → file row with download link; image renders `<img>` (or `next/image`) inline.

Shared header (title, type badge, tags, collection chips, edit/delete buttons) lives in this component, not duplicated per type.

### `ItemCard.tsx` and `ItemList.tsx`

`ItemList` is a server component that takes a pre-fetched `ItemWithType[]` and renders a grid of `ItemCard`. `ItemCard` is the existing pattern from `src/components/dashboard/RecentItems.tsx` — extended to:

- Show a `contentType`-appropriate preview snippet (first line of code, URL host, image thumbnail).
- Surface the pin/favorite toggle via `ItemActionsMenu`.
- Link to `/items/[type]/[id]`.

### `ItemActionsMenu.tsx` (client component)

The dropdown rendered on each card and on the detail view. Wires Pin / Favorite / Edit / Delete to:

- `toggleItemPinned` / `toggleItemFavorite` server actions (optimistic update via `useOptimistic`).
- Routes to `/items/[type]/[id]/edit`.
- Opens `DeleteItemDialog` for destructive action.

### `DeleteItemDialog.tsx`

Built on the existing `Dialog` (`src/components/ui/dialog.tsx`, already used by `DeleteAccountDialog`). Confirms, calls `deleteItem(id)`, and on success routes back to `/items/[type]`.

---

## Where Type-Specific Logic Lives (and Where It Does Not)

| Concern                                | Lives in                                                              | Does NOT live in |
| -------------------------------------- | --------------------------------------------------------------------- | ---------------- |
| Icon component & hex color             | `ICON_COMPONENTS` / `ITEM_TYPE_COLORS` (`src/lib/constants/item-types.ts`) | DB row reads     |
| Which editor a type uses               | Slug → `contentType` map (constants) consumed by `ItemForm`           | Actions, queries |
| Default `language` for snippets        | Editor component default prop                                         | Schema, action   |
| Pro-gating for `file`/`image`          | Route page check + create-action guard                                | Components       |
| Validation rules (URL must be valid…)  | `lib/validation/items.ts` (Zod discriminated union)                   | UI, route        |
| Listing route                          | One file: `app/(dashboard)/items/[type]/page.tsx`                     | Per-type folders |

The recurring rule: **type identity only affects presentation; `contentType` affects behavior.** Anything else is a constant lookup.

---

## Caching and Revalidation

- All `lib/db/items.ts` reads stay uncached at the Prisma layer (server components re-run per request).
- After every mutation in `actions/items.ts`, call `revalidatePath('/items/' + typeSlug)`, `revalidatePath('/dashboard')`, and `revalidatePath('/items/' + typeSlug + '/' + id)` if relevant.
- No `revalidateTag` until search/listing growth proves it's worth the tag bookkeeping.

---

## Open Questions / Out of Scope

These intentionally aren't decided here — flag when the feature actually needs them:

- **Tag creation** — find-or-create flow; tags are global (`Tag.name @unique`), so multi-user tag pollution is a real concern. Maybe scope tags per user later.
- **Search** — current plan is ILIKE in `getItemsByType`. Switch to Postgres FTS or a search service when result quality drops.
- **Bulk actions** — multi-select delete / move-to-collection. Not on the Phase 1 roadmap.
- **Custom item types** — schema already supports `ItemType.userId != null`; UI is "coming soon" per project-overview.md. When built, `getItemTypeBySlug` extends to include user-owned types, and the route `[type]` slug widens past `SYSTEM_TYPE_NAMES`.
- **File upload** — `POST /api/upload` flow (signed R2 URL or proxy upload) is its own design doc; just commit to "action receives a finalized `fileUrl`."
