# KindleMap — Redesign Plan & Roadmap

> Continuity doc for the Apple-inspired redesign and the product sprints that follow it.
> Read alongside `DESIGN_SYSTEM.md`.
>
> **State:** redesign phases 0–4 COMPLETE. Sprint 2 (Library & Book Visual Modes) COMPLETE.
> **Next up:** Sprint 3A — Canvas Interaction Polish.

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

---

## Product roadmap (post-redesign sprints)

1. ✅ Visual Redesign / Design System — *done via Phases 0–4 above*
2. ✅ Library & Book Visual Modes — *done; see Sprint 2 above*
3. **Canvas Desktop Polish Phase 2 — split into two sprints:**
   - **3A — Canvas Interaction Polish ← NEXT.** Layer controls (bring forward / send backward / bring to
     front / send to back, persisted, from the context menu); big-shape click-through & stacking; selection
     hardening (select, multi-select, right-click, delete, duplicate, Ctrl+Z/Y, pan/select separation,
     drawing overlay must not block selection). Optional: display-mode toggle in the selected-node toolbar.
     *Out of scope: resizable nodes, text boxes.*
   - **3B — Canvas Authoring.** Resizable elements; text boxes.
4. Canvas Creative Layer (folders, pins, wallpapers, images, pencil feel)
5. Export Lite (high-res PNG, selected-area export, fix blurry export; defer full PDF)
6. Onboarding System
7. Backend Architecture Spike (Supabase vs Firebase; local-first IndexedDB migration path; sync)
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
