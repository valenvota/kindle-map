# KindleMap — Redesign Plan & Roadmap

> Continuity doc for the Apple-inspired redesign and the product sprints that follow it.
> Read alongside `DESIGN_SYSTEM.md`.
>
> **State:** redesign phases 0–4 COMPLETE. Sprint 2 (Library & Book Visual Modes) COMPLETE.
> Sprint 3A (Canvas Interaction Polish) COMPLETE. Sprint 3B (Canvas Authoring) COMPLETE.
> Sprint 4 (Canvas Creative Layer) COMPLETE. Sprint 4B (Ink — pencil/drawing) COMPLETE.
> Export Lite COMPLETE (WYSIWYG PNG: wallpaper + ink + nodes, hi-res, export all / selection).
> Onboarding v1 COMPLETE (two-step full-screen: Welcome slideshow → Import guide; sample data; checklist).
> Backend Architecture Spike COMPLETE (decision + design spec in `BACKEND_SPIKE.md`).
> **Next up:** implement the backend per `BACKEND_SPIKE.md` — Phase A (local foundation:
> Dexie migration + auto-stamp/soft-delete middleware), still fully offline.

---

## Validated design mockups (static, non-functional)

| Surface | Artifact URL | Status |
|---|---|---|
| Library (v2, refined) | https://claude.ai/code/artifact/4d9e63df-d0b7-4dc9-b2ee-82a57e59a1b7 | ✅ approved |
| BookDetail (full-screen workspace) | https://claude.ai/code/artifact/9316626a-7029-4d4d-a5df-a44ef76c6b58 | ✅ approved |
| Maps / Canvas (dark sidebar) | https://claude.ai/code/artifact/a1008a0d-6394-46c9-b34d-07c04dbfc9b8 | ✅ approved |

Local mockup source files live in the session scratchpad (not the repo).

---

## Core design decisions (locked)

- **Diagnosis:** the earlier "Sprint 1" work repainted a dashboard. Real redesign = change the *skeleton* (persistent shell, content-as-hero layouts), not the shade of blue.
- **Shell:** one persistent **midnight ink-blue sidebar** (macOS-native), paper content. Confirmed the dark sidebar over paper — adopt globally.
- **Type:** **Newsreader** (serif) for content/reading moments; **Inter** for UI. Rule: *serif = content, sans = controls.* Both self-hosted via `@fontsource-variable`.
- **Color:** reduced to **paper + ink + one restrained blue accent (`#3E6B8E`)**. **Ember (`#B06A4F`) ONLY for the important marker.** Status shown by dot+label, not colored fills. No emoji in UI.
- **Covers:** always feel like books — strict **2:3, soft shadow, no square-crop** — in Library Covers mode and Map BookNode Cover mode. Typographic fallback covers (Penguin-Great-Ideas style) for books without images.
- **BookDetail:** full-screen two-column workspace (identity rail + content column), NOT a drawer. Rail ~348px (test 360–376px if cramped).
- **Canvas:** reading-desk feel — faint dot-grid paper, nodes as paper objects, glass tool rail, contextual controls only on selection.

---

## Redesign phases (implementation)

- **Phase 0 — Foundation ✅ DONE (`a39e4d6`)**
  Self-hosted fonts; final token system + backward-compat aliases; shared primitives
  (`src/components/ui/`: Button, SegmentedControl, Surface, StatusPill/Pill, Modal, ContextMenu);
  global `AppShell` + dark `Sidebar` (`src/components/shell/`); Library/Maps/Stats wrapped in shell;
  redundant nav removed from those page headers. Canvas + Import stay full-bleed.

- **Phase 1 — Library redesign ✅ DONE (`86a6c73`; fix pass `fce820c`)**
  Editorial masthead + serif; stat rail; Covers/Cards `SegmentedControl`; single Filter button/popover;
  bookshelf cover grid (2:3 + soft shadow); typographic fallback covers; Cards reading index; shared
  `BookCover` component. Phase 1.1 added `getDisplayTitle` (strips OceanofPDF/dokumen.pub/ISBN/underscores/
  slugs, display-only) + clamped cover/caption typography so messy imports don't break the shelf.

- **Phase 2 — BookDetail ✅ DONE (`bf7a7a3`)**
  Full-screen two-column workspace inside AppShell (replaced the drawer). Identity rail (BookCover, serif
  title, status pill, metadata ledger, tags, Study + Export/Edit). Highlights/Notes/Study segmented control;
  highlights as editorial pulled quotes with ember marker; Notes = serif writing page; Study preview card.
  Edit metadata now in a Modal. All prior functionality preserved.

- **Phase 3 — Maps / canvas ✅ DONE (`8f2e795`)**
  Reading-desk background; BookNode rebuilt as a paper cover (reuses BookCover); glass top toolbar + left
  tool rail; `km-menu` context menu. Canvas now renders **inside AppShell** (dark sidebar, active=maps) per
  the approved mockup — full sidebar, NOT collapsed. Fixed the canvas→book→back viewport reset via a
  module-level per-map viewport cache (restores `defaultViewport` instead of re-running `fitView`).
  Deferred at the time: per-node Card/Cover toggle (needed a new data field) → **shipped in Sprint 2**;
  canvas empty-state emoji → done in Phase 4.

- **Phase 4 — Final token cleanup ✅ DONE** Added shared `.km-field` / `.km-label` form primitives to
  `index.css` (Tailwind v4 here has no semantic color utilities, so `stone-*` classes were converted to
  `var()` tokens inline / via `.km-btn`/`.km-field`). Migrated 17 files: StatsPage (editorial masthead,
  status emoji → `lib-dot`), BookEditForm, both AddBookModals, AddQuoteModal, PlusMenu, NodeStyleToolbar,
  LabeledEdge, the Topic/Note/Quote/Shape nodes, ReadingCanvas (empty-state emoji → lucide icons; label +
  arrow toolbars), CommandPalette, ImportSummary, CoverSuggestionFlow, MapsPage. StudyMode's dark room was
  migrated to a white-alpha scale with `var(--ember)` as the accent (was amber `#C4894A`). Result: **0**
  `stone-*` usages left in the UI (from 158); `tsc -b` + `vite build` green.
  Left intentionally: the 3 emoji in `utils/exportMarkdown.ts` write into exported `.md` files (not UI) and
  belong to the Export sprint.
  **Verified with seeded data** (5 books incl. dirty OceanofPDF/dokumen imports, 9 highlights, a map with
  book/topic/note/quote nodes): Library, Stats, BookDetail (highlights/notes/study), StudyMode (warm-dark
  scale, ember tints compute correctly), canvas (desk + nodes + glass rails), empty-state (lucide chips),
  create-map modal — all render clean, **0 emoji in UI**, no console errors. One bug found & fixed
  (`9747c3f`): the Stats "most highlighted" list rendered raw `book.title`; now uses `getDisplayTitle`.
  Redesign phases 0–4 are fully closed.

---

## Product sprints (implementation)

- **Sprint 2 — Library & Book Visual Modes ✅ COMPLETE**
  - *Library Covers/Cards* — shipped during the redesign (Phase 1): `SegmentedControl` toggling the
    bookshelf cover grid vs the Cards reading index. No further work needed.
  - *Map BookNode Card/Cover display modes* (`e60e81f`, corrected in `08c8f6b`) — each book node on a map
    renders in one of two shapes, switched from the right-click context menu:
    - **cover** — vertical 148×262 2:3 book object (reuses `BookCover`), title-only caption.
    - **card** — horizontal 288×123 paper card: 48px 2:3 thumbnail left, then serif title, author, and
      quiet metadata (`N highlights · N important`, important in ember). Same language as `.lib-row`.
  - Data model: optional `displayMode?: 'card' | 'cover'` on `CanvasNodeData`. **Absence means `card`**, so
    legacy nodes need no migration. Dexie **v7** bump registers schema intent only (no upgrade callback).
  - `ReadingCanvas` queries highlights to derive the important count and syncs it (with `displayMode`) into
    mounted book nodes — opening a book from the canvas and marking highlights returns the user to these
    nodes, so a count frozen at mount would show stale.
  - Auto-arrange grid `NODE_WIDTH` widened 208 → 288 (the card is the default mode; the old spacing overlapped).
  - Verified with seeded data: both modes' geometry, toggle round-trip, selection rings, handles, right-click,
    duplicate (clone keeps mode), Ctrl+Z, delete, console clean.
  - Deferred (optional, → Sprint 3A): Card/Cover toggle on the selected-node toolbar, only if low-risk.

- **Sprint 3A — Canvas Interaction Polish ✅ COMPLETE** (`6ef6482`)
  - Layer controls from the context menu (bring to front / forward / send backward / to back), persisted via a
    `zIndex` field on `CanvasNodeData` (Dexie **v8**, no-op intent bump; absence resolves by type in
    `canvas/layerOrder.ts` — shapes sit behind, everything else in front, so legacy maps need no migration).
  - `zIndexMode="manual"` on `<ReactFlow>` so a selected shape no longer gets a +1000 elevation that made big
    shapes cover and swallow clicks on the nodes inside them.
  - Selection hardening: select / multi-select / right-click / delete / duplicate / Ctrl+Z-Y / pan-vs-select
    separation all verified; the drawing overlay stays `pointer-events:none` in select mode so it never blocks
    node selection.

- **Sprint 3B — Canvas Authoring ✅ COMPLETE**
  - *Resizable elements* — resizing (already on `ShapeNode` via `NodeResizer`) extended to **NoteNode**,
    **QuoteNode**, and the new **TextBoxNode**. BookNode and TopicNode stay fixed on purpose (books must keep
    Card/Cover proportions; topic stays a compact pill). Reuses the existing optional `width`/`height` on
    `CanvasNodeData`; absence ⇒ a per-type default (see `DEFAULT_SIZE` in `ReadingCanvas`), so legacy note/quote
    nodes adopt a sane size and become resizable with no data migration. A size-sync effect mirrors the zIndex
    one so a resize survives undo/redo and duplicate.
  - *Text boxes* — new `type: 'text'` node: free, transparent text (label / title / annotation), distinct from
    the paper NoteNode. Added via a "Text" tool in the left rail; created straight into edit mode (the intent is
    to write) and dropped again if left empty. Styleable via `NodeStyleToolbar`.
  - Data model: `'text'` added to the `CanvasNodeData.type` union and `CanvasTool`. Dexie **v9** — no-op intent
    bump only: the `type` index is value-agnostic and `width`/`height` already existed, so no data rewrite.
  - Files: new `nodes/TextBoxNode.tsx` + `nodes/textAutoEdit.ts`; edits to `ReadingCanvas`, `NoteNode`,
    `QuoteNode`, `CanvasLeftToolbar`, `CanvasToolContext`, `PlusMenu`, `types/canvas.ts`, `db/db.ts`, `index.css`.
  - Verified in-browser with seeded data: create/type/resize/duplicate/undo for text boxes; resize + persistence
    for note/quote/shape; legacy note/quote adopt defaults with no clipping (quote scrolls); BookNode not
    resizable; context menu, layer ops, multi-select, and the drawing overlay all intact; `tsc -b` + `vite build`
    green; console clean.

- **Sprint 4 — Canvas Creative Layer ✅ COMPLETE**
  Four features shipped as a coherent "desk decoration" layer; pencil/drawing improvements were deliberately
  split out to **Sprint 4B — Ink** so this sprint never touches `DrawingLayer` (protecting the select-mode
  pointer-events guardrail).
  - *Image / photo nodes* — new `type: 'image'` node. Pixels stored inline as a (downscaled) data URI in
    `content`, same pattern as `Book.coverImage`. Created via an "Image" tool that opens a native file picker
    (hidden `<input type=file>` in `PlusMenu`); `utils/downscaleImage.ts` caps the longest edge at 1600px and
    re-encodes (PNG keeps alpha, else JPEG) before storing, and sizes the node to the image's aspect. Resizes
    with `NodeResizer keepAspectRatio` so the picture never distorts.
  - *Visual regions / folders* — new `type: 'region'` node: a soft tinted backdrop with an optional title
    (double-click to rename), resizable, styleable via `NodeStyleToolbar`. Sits behind everything (treated like
    `shape` in `layerOrder.ts`, so nodes on top stay clickable — the big-shape click-through guard from 3A).
    Visual only in Sprint 4 — no containment/group movement yet (deferred). Legacy `Group` table intentionally
    NOT reused.
    - **Future direction (do NOT build yet — product intent for a later sprint):** regions should eventually
      become the differentiator vs. a plain shape by acting as **intelligent containers / folders** — nodes
      dropped inside a region can be *associated* with it (membership tracked in the data model), and once that
      exists, moving a region could *optionally* move its contents with it. This is what makes a region more than
      a coloured rectangle. Deliberately out of scope for now; the current region is purely a visual backdrop.
      Likely needs: a region↔node membership relation (e.g. a `regionId` on member nodes or a region-members
      table), hit-testing on drop, and an opt-in "move contents" behaviour on region drag.
  - *Pin / unpin ("pin to the desk")* — optional `locked` flag on `CanvasNodeData`. A pinned node sets
    `draggable`/`connectable` false at the React Flow node level (can't drift) but stays selectable (so it can be
    unpinned). The pin badge is drawn on the `.react-flow__node` wrapper via a `km-pinned` class + a CSS
    `::after` (embedded pin SVG), so it works for every node type with zero per-component plumbing. Toggled from
    the context menu ("Sujetar al lienzo" / "Dessujetar"). A live-query sync effect mirrors the zIndex one so
    pin/unpin updates a mounted node without a remount.
  - *Canvas wallpaper presets* — per-map `background` field on `KindleMap` (`'dots' | 'grid' | 'lines' | 'plain'`,
    absence ⇒ 'dots'). `dots`/`grid` are React Flow `<Background>` layers; `lines` is a custom crisp layer (see
    the fix below); `plain` renders nothing. Picked from a new "Wallpaper" popover in the top toolbar. **Not part
    of node undo/redo** — it lives on the `maps` table, not in the node history snapshot (documented, acceptable).
    - **Post-Sprint-4 bug fix (wallpaper not visible):** the pattern rendered but was hidden. `index.css` painted
      an opaque `background: var(--canvas-bg)` on `.react-flow__renderer` (z-index 4), which covered the
      `<Background>` pattern (z-index -1). Fixed by making the renderer transparent — the desk color already lives
      on `.react-flow` (behind the pattern), so the pattern now shows with nodes on top. This also un-hid the
      original dot grid, which had been invisible since Phase 3. Preset colors were also bumped from near-invisible
      (~0.07–0.14 ink) to legible-but-calm values (dots 0.28/r2.2, grid 0.16, lines 0.20).
    - **Post-Sprint-4 bug fix (Lines blurry when zooming):** the old `lines` preset used the React Flow Lines
      variant with a huge `gap=[100000,30]` to suppress vertical lines, but that giant SVG pattern tile rasterizes
      blurry when the viewport scales it. Replaced ONLY the `lines` preset with a custom `LinesBackground`
      component (`ReadingCanvas`): a `pointer-events:none`, `z-index:-1` div painted with a
      `repeating-linear-gradient`, panned via `background-position-y` and zoomed via the gradient period (both from
      `useViewport()`). Gradients paint at native resolution, so the ruling stays crisp at any zoom. Dots/grid/plain
      unchanged.
  - Data model: `'image'`/`'region'` added to the `type` union; `locked` on `CanvasNodeData`; `background` on
    `KindleMap`. Dexie **v10** — no-op intent bump only (type index is value-agnostic; `locked`/`background` are
    non-indexed optional fields with absence-defaults, so no data migration).
  - Files: new `nodes/RegionNode.tsx`, `nodes/ImageNode.tsx`, `utils/downscaleImage.ts`; edits to `ReadingCanvas`,
    `CanvasToolbar`, `CanvasLeftToolbar`, `CanvasToolContext`, `PlusMenu`, `layerOrder.ts`, `canvasRepository.ts`,
    `mapsRepository.ts`, `types/canvas.ts`, `types/map.ts`, `db/db.ts`, `index.css`.
  - Verified in-browser with seeded data: region create/rename/tint/resize + sits behind (z=0) with nodes on top
    still clickable; image upload → downscale (2400→1600) → aspect-fit render + Export PNG with an image present
    (no taint, console clean); pin → badge + non-draggable + still selectable, unpin restores drag; all four
    wallpaper presets now visibly distinct on-canvas (dots / grid / lines / plain) and persist per-map across
    remount; duplicate + undo (region) intact; drawing overlay still `pointer-events:none` in select mode /
    `all` in pencil mode. `tsc -b` + `vite build` green.

- **Sprint 4B — Ink (pencil/drawing) ✅ COMPLETE**
  The drawing-feel work deliberately split out of Sprint 4. This is the one sprint that *does* touch
  `DrawingLayer.tsx`; the select-mode guardrail (`pointer-events:none` in select, `all` only for draw tools) was
  preserved and re-verified.
  - *Pressure / variable-width strokes* — added **`perfect-freehand`** (dependency). Strokes now render as a
    filled variable-width outline (`getStroke` → SVG fill path) instead of a constant-width `stroke`. Uses
    `simulatePressure: true` so mouse/trackpad (which report a flat 0.5 pressure) still get a velocity-tapered,
    inky line; `thinning/smoothing/streamline` tuned for a calm pencil feel. Marker stays translucent (opacity
    0.35); the wide invisible **centerline hit-path** is kept for click-selection.
  - *Better smoothing / sampling* — removed the `SAMPLE_RATE` input decimation; `streamline` now does the
    smoothing, so strokes keep all their points and read cleaner.
  - *Scoped undo/redo for strokes* — snapshot stacks live in `DrawingLayer`. Ctrl+Z/Y is handled there **only
    while a drawing tool is engaged**; the node-history handler in `ReadingCanvas` early-returns when a draw tool
    is active (checked via an `activeToolRef`). So: **draw mode → Ctrl+Z/Y affects strokes; select mode → affects
    nodes** (per spec, no unified timeline). Add/erase/delete-selected are all undoable; one undo step per eraser
    gesture (snapshot captured on the first stroke erased).
  - *Kept as-is (per scope):* eraser stays whole-stroke; no partial eraser, no stroke move/resize, no restyling
    existing strokes.
  - Data model: **none** — `StrokePoint.pressure` already existed and was already captured; strokes render from
    stored points. **No Dexie migration / version bump.**
  - Files: `perfect-freehand` in `package.json`; rewrote `DrawingLayer.tsx`; `ReadingCanvas.tsx` (node-undo guard
    + `activeToolRef`).
  - Verified in-browser (strokes injected + drawn via dispatched pointer events, since the harness can't sample
    real `pointermove`): strokes render as variable-width filled ink; pencil-add undo/redo (3→2→3); eraser
    whole-stroke delete + undo (draw→erase→undo restores); **select-mode Ctrl+Z leaves strokes untouched**
    (scoping); node selection + stroke selection both work with strokes present; overlay `pointer-events:none` in
    select / `all` in pencil (guardrail); Export PNG with strokes present, console clean. `tsc -b` + `vite build`
    green.

- **Export Lite ✅ COMPLETE** (roadmap item 5)
  Faithful PNG export of a map, and the fix for the long-standing "blurry export".
  - *Blur root cause + fix* — `getViewportForBounds`' `padding` argument is a **ratio of the container, not
    pixels**. The old export passed `80`, read as 8000% padding, which collapsed the content to min-zoom and
    rendered it tiny/letterboxed (hence blurry). Now `PADDING = 0.12` (~12% margin) → the content fills the frame.
  - *WYSIWYG capture (wallpaper + ink + nodes)* — the old export cloned only `.react-flow__viewport` (nodes/edges),
    so the wallpaper and ink strokes — which render as siblings *outside* that element — were missing. New approach
    briefly fits the **live** React Flow viewport to the target bounds and captures the whole `.react-flow`
    element, so wallpaper + strokes + nodes + edges all come through. Controls / panels / attribution are removed
    via html-to-image's `filter`; the app toolbars sit outside `.react-flow` and are excluded already. The
    original viewport is always restored in `finally`.
  - *Hi-res* — output scaled toward ~2400px wide via `pixelRatio`, capped so neither side exceeds 4096px.
    Background colour read from the live desk (`--canvas-bg`).
  - *Export all vs selection* — the Export PNG button is now a small dropdown: **Export whole map** (bounds =
    union of node bounds + ink-stroke bounds, so nothing clips) and **Export selection** (bounds of the selected
    nodes; enabled only when something is selected).
  - *Defensive* — throws early if the canvas has no on-screen size; a 30s `Promise.race` timeout means a
    pathological html-to-image hang can't leave the canvas stuck (finally still restores the viewport).
  - Data model: **none**. Files: rewrote `utils/exportMapImage.ts`; `ReadingCanvas.tsx` (`onInit` instance ref,
    export-all/selection handlers, node+stroke bounds union); `CanvasToolbar.tsx` (export dropdown).
  - Scope kept tight (per request): no PDF, no SVG, no clipboard, no transparent background, no custom draw-your-own
    export area.
  - Verified in-browser: the padding fix (fit zoom went from a broken 0.05 → a correct ~0.83 for the real bounds);
    the real handler wiring end-to-end (onInit instance → dropdown → node+stroke bounds union → `setViewport` to the
    fitted zoom 0.828); **viewport restores to its exact pre-export value and the button resets**; the 0-size guard
    fires cleanly when the pane is hidden. `tsc -b` + `vite build` green. **Not verifiable in this sandbox:** the
    actual toPng pixel output — html-to-image hangs on *everything* here (even a trivial detached `<div>`, and the
    pre-existing export path), an environment limitation; the produced PNG's contents should be confirmed on a real
    machine.

- **Onboarding v1 ✅ COMPLETE** (roadmap item 6) — *redesigned to a two-step full-screen flow*
  A calm, premium first-run, kept deliberately lean (no spotlight tour, no video, no AI/Study onboarding, no
  account/sync, no Dexie change). Two full-screen **dark editorial** scenes (one committed visual world, not a
  split panel), so the user faces one mental task at a time.
  - *Step 1 — Welcome* (`components/onboarding/WelcomeScreen.tsx`) — full-screen; a 3-slide **value slideshow**
    (each: animated inline-SVG hero + serif headline + subline), auto-advancing (6s, pauses on hover, disabled
    under `prefers-reduced-motion`) with dots + arrows. Two persistent CTAs below: **Import your highlights**
    (→ Step 2) and **Explore with sample data**. No import instructions here.
  - *Step 2 — Import guide* (`components/onboarding/ImportGuide.tsx`) — full-screen; a big central journey
    illustration (Kindle drive → `documents` → `My Clippings.txt`), 5 concise steps, and the dropzone as the
    single import affordance (reuses `FileUploader` + `useImportClippings` + `ImportSummary`; the summary shows in
    a light card on the dark ground). A clear **‹ Back to welcome**. Invalid-file feedback is inline
    (`FileUploader.tsx`).
  - *Navigation state machine* (`App.tsx`) — an ephemeral `onbNav: 'welcome' | 'guide' | 'app' | null` override;
    when null it **derives** from the data (`bookCount 0 → welcome`, else `app`). There is deliberately **no
    `welcomeSeen` flag** — that's what used to trap users. Flows: Welcome→guide; guide→Back→Welcome;
    Welcome→Explore→app; app(sample)→Back-to-welcome (banner); **Remove sample→Welcome** (re-explorable). Reload is
    intentional and tested: empty→Welcome, sample-loaded→app+banner, real books→app.
  - *Explore with sample data* (`utils/sampleData.ts`, unchanged) — a curated **mini-demo**: 3 real books (Deep
    Work, Thinking Fast and Slow, Atomic Habits), 6 highlights (3 important) + a book note, and a "Focus &
    Attention" map (two book nodes, a topic, a quote, a text label, a note, grouped in a region with labelled
    edges). All `sample-`-prefixed → `clearSampleData()` removes it with zero residue, no schema field.
  - *Sample-data banner* (`SampleDataBanner.tsx`) — slim in-app bar: **‹ Back to welcome** + "Remove sample data";
    neither traps the user.
  - *Getting-Started checklist* (`GettingStartedChecklist.tsx`) — calm, dismissible corner card (import / open a
    book / create a map / draw), derived from data + an `openedBook` flag; only in the app.
  - *State* — onboarding flags in **localStorage** (`utils/onboarding.ts`: `sampleLoaded`, `openedBook`,
    `checklistDismissed`), not Dexie.
  - Verified in-browser (wiped DB + localStorage): Welcome slideshow (auto-advance + dots/arrows change slides);
    Import→guide→Back→Welcome; guide dropzone real import (2 books / 3 highlights → summary → View my library →
    app); invalid `.pdf` shows the inline message; Explore→app+banner; banner Back→Welcome (sample kept);
    **Remove→Welcome→Explore-again** (3→0→3, never trapped); all three reload states land correctly; returning
    user with real books skips onboarding. `tsc -b` + `vite build` green; console clean.

---

## Product roadmap (post-redesign sprints)

1. ✅ Visual Redesign / Design System — *done via Phases 0–4 above*
2. ✅ Library & Book Visual Modes — *done; see Sprint 2 above*
3. ✅ **Canvas Desktop Polish Phase 2 (split into two sprints) — done; see Sprint 3A & 3B above:**
   - ✅ **3A — Canvas Interaction Polish.** Layer controls (persisted, from the context menu); big-shape
     click-through & stacking; selection hardening (select, multi-select, right-click, delete, duplicate,
     Ctrl+Z/Y, pan/select separation, drawing overlay must not block selection).
   - ✅ **3B — Canvas Authoring.** Resizable elements (Note/Quote/TextBox + existing Shape); free text boxes.
4. ✅ **Canvas Creative Layer — done; see Sprint 4 above** (image nodes, visual regions, pin/unpin, wallpaper
   presets). ✅ **Sprint 4B — Ink** also done (pressure/variable-width strokes via `perfect-freehand`, better
   smoothing, scoped drawing-mode undo/redo). Canvas work is now complete.
   - **Future: Custom wallpaper upload** — let the user upload their own image/photo as the canvas wallpaper (a
     per-map background image), beyond the built-in dots/grid/lines/plain presets. A later sprint of its own —
     **not part of Sprint 4 or Sprint 4B.** Likely reuses `utils/downscaleImage.ts` and stores the data URI on the
     map's `background` field (or a sibling field); needs tiling/fit + opacity handling so it doesn't fight the
     paper feel, and care around Export PNG (large embedded images).
5. ✅ **Export Lite — done; see Export Lite below** (WYSIWYG hi-res PNG incl. wallpaper + ink, export all /
   selection; fixed the blurry-export bug). Full PDF still deferred.
6. ✅ **Onboarding System — done; see Onboarding v1 below** (two-step full-screen flow: Welcome slideshow →
   Import guide; sample data; invalid-file feedback; Back navigation; Getting-Started checklist). Kept lean: no
   spotlight tour, no video.
7. ✅ **Backend Architecture Spike — done; decision + deep design spec in `BACKEND_SPIKE.md`.**
   Decision: **Supabase** (Postgres + Auth + RLS + Storage) with a deliberately minimal
   **single-user last-write-wins sync** (no outbox/CRDT; tombstones for deletes; auto-stamped
   via Dexie middleware). Identity is **anonymous-local by default, claimed on optional
   sign-in** → app forever usable with no account, login progressive. **Ship backup before
   sync.** Dexie Cloud = documented fallback; Firestore rejected (relational mismatch + 1 MB
   doc limit); PowerSync/Electric parked (would replace Dexie as the local store). Phased
   rollout A→F in the doc. **← implementation is NEXT** (Phase A: local foundation, no backend).
8. Book Workspace UX (Study Mode UX only — reflections, marking, flow; no AI yet)
9. AI Layer (concepts, summaries, study questions, connections; preserve highlightId + source metadata)
10. Stats v2 (charts, Wrapped)
11. Sharing / Social Layer (shareable bookshelf; Goodreads/Kindle as stretch)
12. Account / Sync / Freemium (Google login, cloud sync, free vs premium)

---

## Guardrails carried across phases

- No new product features during redesign phases.
- No data-model changes during redesign phases.
- Don't touch AI, export, onboarding, backend, or freemium until their sprint.
- Keep everything functional; ship each phase reversibly; verify before commit.
- Repo: `https://github.com/valenvota/kindle-map` (branch `main`, auto-deploys to Vercel).
