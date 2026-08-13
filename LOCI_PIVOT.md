# Loci — Product Pivot & Migration Plan

> Strategic direction for evolving the app from **KindleMap / Maps** into **Loci**.
> Approved as direction, **not** as a rewrite. Read alongside `REDESIGN_PLAN.md`,
> `DESIGN_SYSTEM.md`, and `BACKEND_SPIKE.md`.
>
> **Status:** planning. L1 (the navigational spine) is scoped below but **not yet
> implemented**. Nothing here is built.

---

## Why this pivot

Loci turns dispersed reading and knowledge into **your own thinking**.

The problem: we read books, PDFs, articles and notes, highlight what matters, and
have momentary thoughts — but most of it later disappears or stays fragmented.
Loci exists to make those fragments **clear, connected, recognizable, recallable,
easy to consult, and reusable**.

The product is **not** primarily a highlights library, and **not** just a mind map.
The core arc is:

> **dispersed material → knowledge with shape → your own thinking**

Two target "wow" moments:

- **Wow 1 — Shape.** The user turns scattered highlights/notes into something
  useful: a summary, study notes, concepts, questions, connections, a mind map, a
  synthesis. *(This is a later sprint — see Deferred. Not in L1.)*
- **Wow 2 — Place.** The user brings that knowledge into their Locus and sees, at a
  glance, how it relates to everything else they know and are thinking about.

---

## The core insight (why this is reuse, not rewrite)

**What Loci calls a _Room_ already exists in the codebase — it's called a _Map_.**

Today a "Map" is a named, scoped collection of canvas nodes (`maps` table; nodes
scoped by `mapId`), rendered by `ReadingCanvas`. There are many separate maps, and
you pick one from a list. That is structurally almost exactly a Room.

The translation is nearly 1:1:

| Loci concept | Already exists as | Gap to close |
|---|---|---|
| **Room** | a `map` (scoped node collection + wallpaper) | a parent, a card on the parent, enter/exit |
| **Enter a Room** | `goToMap(mapId)` (switch active canvas) | zoom transition + breadcrumb |
| **Locus** | — (new), but = *a map with no parent* (the root) | designate/create one root map |
| **Library** | `LibraryPage` | extend to PDFs/articles/collections later |
| **Search** | `CommandPalette` (⌘K) | rename/extend scope |
| **Source inside Locus** | a book node references a `bookId` (not duplicated) | reuse this exact pattern for Rooms |
| **Desk** | — (new) | read-only composition of existing queries |

**We are not building a new canvas.** `ReadingCanvas` already renders "the nodes of
one map." The Locus and every Room are just **maps in a tree**. That single idea
removes most of the risk.

---

## The new mental model

Loci is organized around three spaces, each with a distinct mental function, plus
Rooms as contexts inside the Locus.

- **Desk — where you return.** Not a SaaS dashboard with metrics and widgets. A
  personal return surface: "this is what you were thinking about lately." Recent
  highlights, recent notes, recently opened sources, recent Rooms, and a prominent
  *Continue in Locus* card. It must stay shallow — a surface, not a fourth tool.
- **Library — where source material lives.** The structured, traditional part:
  find, search, filter, sort, metadata, collections. Books, Kindle/Apple Books
  imports, PDFs, articles, lecture notes. *Library is not a canvas* — a list/grid is
  the right metaphor. Rule: **Library = where knowledge enters.**
- **Locus — where you shape it.** One large, continuous, potentially infinite
  spatial workspace per user (*"Valentin's Locus"*). Notes, highlights, books, PDFs,
  images, drawings, concepts, connections, summaries, questions, sources, and Rooms
  all live here. Rule: **Library stores it. Locus shapes it.**
- **Room — a context inside your Locus.** Reading, University, Business, Writing,
  Personal Research… From the top level a Room is a card/container with a preview of
  its contents. Double-clicking a Room zooms in and makes it the active context; the
  rest of the canvas falls away and you work as if that space were the whole canvas.
  Rooms can nest.

Product language to adopt: **Desk** (the place you return to), **Library** (where
source material lives), **Locus** (where you work with it), **Room** (a context
inside your Locus).

---

## How current Maps map to Rooms

- A **Map → a Room.** Same table, same node scoping, same wallpaper. No data-shape
  change to what a map *is*.
- **Entering a map (`goToMap`) → entering a Room.** The navigation primitive already
  exists; we add a zoom transition and a breadcrumb around it.
- **The Locus → the root map.** A single map with no parent. Existing top-level maps
  become Rooms hanging off that root.
- The current **"Maps" list screen** dissolves: instead of picking from a list, you
  open your Locus and see Rooms as cards on it. (The list can stay reachable as a
  fallback during the transition.)

### Room model (decided)

A **RoomNode works conceptually like a BookNode**:

- a **BookNode** references a `bookId` (the book lives in Library, not duplicated),
- a **RoomNode** references a `roomId` / child `mapId` (the room's contents live in
  its own map, not duplicated).

This keeps the parent canvas as **"just nodes"** and avoids inventing a separate
positioning model for Rooms. Position/size/z-order come from the node, exactly as
for every other node. A Room is therefore two things working together:

1. **a `map` row** — the container of the Room's own contents, and
2. **a `type: 'room'` node on the parent map** — the card/reference, carrying the
   position and a preview.

Nesting falls out for free: a Room's map can itself contain `room` nodes pointing to
deeper Room maps.

---

## What gets reused

Reused essentially as-is:

- **The entire canvas engine** — `ReadingCanvas`, all node types
  (book/topic/note/quote/shape/text/image/region), edges, strokes, wallpapers,
  **layer controls, resizing, PNG export** (Sprints 3–4).
- **`CommandPalette`** (⌘K global search) — the "search safety net."
- **`AppShell` / `Sidebar`** — relabel only.
- **`BookDetailView`**, the onboarding scaffolding, soft-delete, and the sync-ready
  fields (`ownerId` / `updatedAt` / `deletedAt`) from the Backend Spike.
- **The Dexie model** — small additions only (see below), not a rewrite.

Evolved rather than reused:

- **`RegionNode`** — today a purely visual tinted backdrop with a title (it does not
  contain nodes). It is the visual seed of a Room; the RoomNode either evolves from
  it or ships as a sibling that renders a child-map preview and supports enter/exit.

---

## What changes in navigation

- Rebrand **KindleMap → Loci**. Sidebar nav becomes **Desk / Library / Locus**
  (Stats demoted to secondary, or folded into Desk later).
- **Desk becomes home** (the return surface), replacing the current default landing.
- **"Maps" as a list disappears.** You open your Locus and see Rooms as cards.
  Entering a Room reuses `goToMap`, now wrapped with a **camera zoom** and a
  **breadcrumb** (`Valentin's Locus / Reading / Psychology`). Exiting walks back up
  the parent chain. Search / Quick-Jump can jump anywhere.

---

## Data model implications

Small and additive:

- `KindleMap` gains **`parentId?: string`** — undefined marks the Locus root. Maps
  become a **tree**.
- New node type **`'room'`** in the `CanvasNodeData.type` union, carrying a
  **`roomId`** (the child map it references) — structurally identical to how a book
  node carries `bookId`. Position / size / z-order already exist on nodes.
- **No change** to books, highlights, or notes.
- New fields flow through the existing `updatedAt` / `ownerId` auto-stamp, so
  sync-readiness (Backend Spike Phase A) is preserved.

Note for later (not L1): "send content to a Room" and "move a node into a Room" are
just **changing a node's `mapId`**. The model supports it trivially; only the
interaction is deferred.

---

## Migration strategy

One migration with real content — **Dexie v12** (current schema is v11):

1. Create a single **root Locus map** per owner.
2. Set every existing map's **`parentId`** to that root.
3. Generate a **`room` node on the root** for each existing map (grid-positioned),
   so today's maps immediately appear as Room cards on the Locus.

Properties: mechanical but must be correct; reversible in spirit (soft, additive);
all data is local and sync-stamped. Verify against seeded multi-map data before
trusting it.

Keep the app working throughout: **add Locus alongside Maps; do not remove the Maps
list until Locus is proven.**

---

## Risks

1. **The v12 migration** (root + re-parent + generate room cards) is the one place
   real data moves. *Mitigate:* additive/reversible, verified against seeded
   multi-map data.
2. **Naming confusion** during transition — `map` (table) vs *Room* (concept) vs
   *Locus* (root map). *Mitigate:* **keep internal table/type names; relabel only the
   UI.** Renaming the data layer would manufacture the very rewrite we're avoiding.
3. **Enter/exit polish.** *Mitigate:* ship instant switching first (graceful degrade
   to today's `goToMap`), animate later.
4. **Scope creep** — the `/` menu and AI are seductive. *Mitigate:* spine-only L1,
   everything else deferred in writing (below).
5. **Reprioritization vs Backend Phase B.** This pivot jumps ahead of Backend Phase
   B (Supabase). Acceptable, but new fields must not regress the sync stamping.

Not a risk: **the visual direction already matches the mockups** (dark ink sidebar,
warm paper, Newsreader + Inter, restrained accent, tactile cards, no glassmorphism).
The pivot is architecture + naming, not a reskin. The mockups' extra accents
(red / yellow) are a minor later addition.

---

## L1 — "Loci: the spine" (first sprint)

**Goal:** validate the navigational loop end to end and nothing deeper:

> **Desk → Library → open book → Locus → enter Room → back out → find it in Search.**

If that loop feels like Loci, the pivot is validated and everything else is
incremental.

Scope:

1. Rebrand the shell to **Loci**; nav = **Desk / Library / Locus** (Stats demoted).
2. **Dexie v12**: root Locus map + re-parent existing maps + generate `room` cards on
   the root.
3. **`room` node type** + a RoomCard renderer (evolve `RegionNode` or a sibling)
   showing name + a small content preview; **double-click enters** (reuse
   `goToMap`), **breadcrumb** to exit.
4. **Desk** as a read-only return surface: recent highlights, recent notes, recent
   Rooms, and *Continue in Locus* — all composed from existing queries.
5. **Verify** the full loop in-browser with seeded data.

**Keep the old Maps access during L1 (non-negotiable).** The existing Maps list and
its screen must **remain available and functional** throughout L1 — Locus ships
*alongside* it, not in place of it. **Do not delete, hide, or permanently remove the
old Maps access** until the Locus flow is proven. The Maps list is the safety net if
the new navigation doesn't hold up; only after Locus is validated do we revisit
retiring it.

**Explicitly not in L1:** the `/` command menu; the AI *Shape into…* flow; connection
restyling; deep-nesting UI; PDFs/articles ingestion; Collections UI;
drag-between-Rooms; the zoom *animation* (instant first).

---

## Explicitly deferred (post-L1, in rough order)

- **Wow 1 — AI "Shape into…"** its own sprint. Select highlights → *Shape into…* →
  Summary / Study notes / Questions / Concepts / Mind map. AI is a **contextual
  tool, not a chatbot**: it helps give shape to the user's thinking, it doesn't
  replace it. Can be mocked before real AI.
- **`/` command menu** on the canvas (`/note`, `/room`, `/book`, `/quote`, `/image`,
  `/source`, `/question`, `/summary`, `/concept`) — designed to be extensible.
- **Connections** restyled to feel subtle and editorial (comprehension, not a
  technical graph of arrows).
- **Cross-Room movement** — drag/send a node into a Room (change `mapId`).
- **Deeper nesting UI** beyond 1–2 visible levels (model already supports arbitrary
  depth — see below).
- **Library growth** — PDFs, articles, Apple Books and other importers, Collections /
  Topics as first-class.
- **Camera zoom animation** for enter/exit.
- **Quick-Jump** (⌘K to jump anywhere, not just search).

### Nesting — evaluation

- **Data:** trivial — one `parentId`. A tree.
- **Canvas / React Flow:** *no impact.* Only one level renders at a time (the active
  Room's direct children); nested Rooms never render simultaneously, so performance
  is identical to today's single-map render at any depth.
- **Navigation:** breadcrumb walks `parentId` upward — works for N levels.
- **Persistence:** unchanged (nodes scoped by `mapId`).
- **Decision:** put **arbitrary depth in the data model** (it costs nothing), but
  **surface only 1–2 levels in the UI** at first. The model will never block going
  deeper.

---

## Long-term platform vision (FUTURE — not near-term roadmap)

> This section is a **north star, not a plan.** Nothing here is scheduled. It exists
> so near-term decisions don't accidentally block it.

A Room is personal today. Over time it could become something **others can use,
study from, or build on.** A staged arc:

1. **Personal Rooms** — a Room is your own context. *(This is what L1 begins to prove.)*
2. **Room templates** — a Room's structure becomes a reusable starting point (e.g. a
   template for studying a book, a course, a framework).
3. **Shared Rooms** — a Room can be shared with another person to read, study from,
   or extend. (Close in spirit to custom maps / templates / workshops.)
4. **Room marketplace** — creators publish high-quality Rooms around books, courses,
   topics, university subjects, business frameworks, writing systems, etc., and can
   potentially **monetize premium Rooms**.

**Sequencing discipline:** each stage must be *earned* by the previous one. First
prove **personal** Rooms are valuable; then that **shared / template** Rooms are
valuable; only then consider a **marketplace**. Do not build marketplace machinery
before personal Rooms have demonstrated value.

Implication to keep in mind now (not to build now): the `roomId` reference model and
the sync-ready per-row `ownerId` already point in a shareable direction — a Room is a
self-contained map subtree with an owner. That is the right shape to *not* paint
ourselves out of, without doing any of the sharing work yet.
