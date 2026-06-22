# KindleMap

> A visual map of your reading mind.

A personal web app to organize, explore, and think with your Kindle highlights.
No backend. No accounts. Everything stays in your browser.

---

## Product Vision

**KindleMap** has two distinct layers:

### 1. Library — source of truth
The Library is the complete database of everything you've read and highlighted. Every book lives here, whether imported from Kindle or added manually. This is the home screen.

### 2. Maps — intentional thinking spaces
A Map is a blank infinite canvas the user creates on purpose. You manually add books from your Library into a Map. Maps are for thinking: connecting ideas, building a reading roadmap, preparing for a project, organizing a theme.

**Key principle:** books do not appear automatically in every map. A Map is curated, not automatic.

---

## Architecture

```
Library (Dashboard)           Maps (Reading Maps)
─────────────────────         ──────────────────────────────
Source of truth               Intentional thinking spaces
All books + highlights        User-created, blank by default
Filters, search, sort         Books added manually from Library
Import from Kindle            Nodes: Book, Topic, Note, Group, Quote
Add books manually            Connections between nodes (future)
Export to Markdown            Saved per-map in IndexedDB
```

### Data model

```
Book          → source of truth, lives in Library
Highlight     → belongs to a Book
Map           → user-created canvas (name, createdAt)
MapNode       → a node inside a specific Map (bookId, position, type)
BookNote      → manual note attached to a Book
Group         → visual grouping inside a Map (future)
```

### DB schema (Dexie v1)

| Table | Key | Purpose |
|---|---|---|
| `books` | `id` | All books (Kindle + manual) |
| `highlights` | `id` | All highlights, indexed by `bookId` |
| `canvasNodes` | `id` | Node positions, per map (needs `mapId`) |
| `groups` | `id` | Visual groups inside maps |
| `bookNotes` | `id` | Manual notes attached to books |

> **Migration needed (Sprint 3):** `canvasNodes` needs a `mapId` field and a `maps` table to support multiple maps.

---

## Stack

| Layer | Choice |
|---|---|
| Build | Vite |
| UI | React + TypeScript |
| Styles | Tailwind CSS v4 |
| Canvas | @xyflow/react |
| Storage | Dexie.js (IndexedDB) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deploy | Vercel |

---

## Roadmap

### ✅ Sprint 1 — Foundation
- Kindle `My Clippings.txt` parser (EN + ES)
- Stable ID generation (no duplicates on re-import)
- Dexie v1 schema: books, highlights, canvasNodes, groups, bookNotes
- Import flow: drag & drop → parse → save → summary
- Library view: book grid, search by title/author
- Book detail drawer: highlights, search, star, copy, export to Markdown

### ✅ Sprint 1.5 — Deployment
- Production build verified
- `vercel.json` SPA rewrite config
- Deployed to Vercel

### ✅ Sprint 2 — Infinite Canvas (v1, now a feature — not home)
- `ReadingCanvas` with React Flow
- `BookNode`: draggable card with accent color, title, author, highlight count
- `CanvasToolbar`: Import, Auto arrange, toggle List/Canvas
- Drag positions persisted to IndexedDB on drag stop only
- Double click opens BookDetailView

### 🔜 Sprint 3 — Library as Home + Maps Architecture
**Conceptual shift:** Library becomes the default home screen. Canvas becomes "Maps" — a separate feature.

- [ ] Make Library the default screen (replace canvas as home)
- [ ] Add `maps` table to Dexie (name, createdAt, updatedAt)
- [ ] Add `mapId` to `canvasNodes` (rename to `mapNodes`)
- [ ] "Maps" section in the app: list of user-created maps
- [ ] Create new map → blank canvas opens
- [ ] Floating "+" button inside canvas
- [ ] "Add Book" → searchable book picker from Library
- [ ] Selecting a book adds it as a node to the current map only

### ✅ Sprint 4 — "+" Menu (canvas primitives)
- [x] Floating "+" FAB → animated menu (Book, Topic, Note, Quote)
- [x] TopicNode — inline double-click editing, saves on blur
- [x] NoteNode — inline textarea editing, saves on blur / Ctrl+Enter
- [x] QuoteNode — two-step picker (book → highlight); preserves bookId + highlightId
- [x] All nodes scoped to mapId; IDs are `${mapId}:${type}-${id}`

### ✅ Sprint 5 — Library filters + Tags v1
- [x] Filter bar: Source chips (All / Kindle / Manual)
- [x] Toggle chips: Needs attention, No highlights
- [x] Sort dropdown: Title A–Z/Z–A, Most/Fewest highlights, Recently added
- [x] Tag filter: derived from all unique tags across books; single-select chip row
- [x] Tag display on BookCard (max 2 chips + overflow count)
- [x] Tag display in BookDetailView header
- [x] Active book count: "12 of 47 books" when filters are active
- [x] "Clear filters" shortcut when any filter is active
- [x] Tags already editable via BookEditForm and AddBookModal (from Sprint 3/6)

### ✅ Sprint 6 — Add book manually
- [x] "+ Add book" button in Library header
- [x] Modal: title, author, description, tags, color swatch
- [x] source = 'manual'; appears in Library and can be added to any map

### 🔜 Sprint 7 — Library filters (advanced)
- [ ] Filter by author (dropdown with search)
- [ ] Filter by tags
- [ ] Filter by included / not included in a specific map
- [ ] Filter by language (future)

---

## Canvas roadmap (Figma-like infinite thinking board)

Built in layers: usability first, then styling, then shapes/arrows, then grouping/folders, then freehand ink.

### ✅ Canvas Styling v1 (Sprint 9)
- [x] Per-node background, border, text color for Topic/Note/Quote nodes
- [x] Floating style toolbar on selection
- [x] Reset to default

### ✅ Canvas UX / Figma-like interactions (Sprint 10)
- [x] Visible, context-appropriate cursor (default / grab / grabbing / crosshair / text)
- [x] Better grab/select hit areas and hover/selection states
- [x] Multi-select (drag-select box + shift/ctrl/cmd-click)
- [x] Move selected nodes together, persist all positions on drag stop

### ✅ Sprint 11 — Shapes v1 (Arrows paused)
- [x] Rectangle / circle shapes as standalone canvas primitives
- [x] Shapes added from the "+" menu, draggable, support NodeStyleToolbar
- [x] Shapes support resizing (persisted)
- [⏸️] Arrows / connections between nodes — **paused, see note below**

> **Arrows / React Flow edges were attempted in Sprint 11 but paused.** Node click handling and edge data creation worked, but edges did not visibly render in production despite valid node IDs and CSS fixes. We are deferring arrows to a future isolated sprint, possibly with a custom SVG overlay instead of React Flow edges. The Arrow tool is hidden from the toolbar and edge-creation UI is disabled, but the `canvasEdges` Dexie table and underlying edge code remain in place (unused) to avoid migration churn.

### 🔜 Arrow styling (post-relaunch)
- [ ] Basic arrow styling (color, thickness, arrowhead)
- [ ] Labels on arrows

### 🔜 Linked Movement / Lightweight Grouping
- [ ] Select multiple nodes and "link" them together
- [ ] Moving one linked node moves the whole linked set
- [ ] Not full folder/group containers yet — a lighter precursor
- [ ] Data model TBD (likely `linkedGroupId` on `canvasNodes`)

### 🔜 Canvas Folders
- [ ] Folder node on the canvas (visual bounding box with label)
- [ ] User can place books inside a folder by dragging
- [ ] Opening a folder shows its contents in a list-style view
- [ ] Books/highlights are never deleted — folders are purely organizational
- [ ] Data model TBD (extends `CanvasNodeData` or new table)

### 🔜 Ink / Drawing Mode
- [ ] Apple Pencil support
- [ ] Mouse/touch freehand drawing
- [ ] Pencil, marker/highlighter, eraser tools
- [ ] Color and stroke size controls
- [ ] Undo/redo
- [ ] Implemented as a separate ink layer over/under the React Flow canvas, not mixed into the node system

---

### 🔜 Sprint 9 — Global search (Cmd+K)
- [ ] Search books by title / author
- [ ] Search highlights by text
- [ ] Result → focus node in canvas or open book detail

### 🔜 Sprint 10 — Study mode
- [ ] Search books by title / author
- [ ] Search highlights by text
- [ ] Result → focus node in canvas or open book detail

### 🔜 Sprint 8 — Study mode
- [ ] "Study this book" button in book detail
- [ ] Show random highlight, navigate with Next
- [ ] Mark as important
- [ ] Write a question / reflection per highlight

### 🔜 Sprint 9 — AI layer (future)
- [ ] Summarize a book's highlights
- [ ] Q&A over highlights
- [ ] Suggest connections between books
- [ ] Architecture already allows this (no backend coupling)

### ✅ Book Covers — Phase 1 (Manual covers)
- [x] Allow uploading a book cover from Edit Book Info
- [x] Compress/downscale image (max 600px, JPEG ~0.8) before storing
- [x] Store cover image locally as base64 data URI on `Book.coverImage` (Dexie v4)
- [x] Display cover in Library cards and BookDetailView
- [ ] BookNode covers in maps — skipped this sprint, can reuse the same field later

**Phase 2 — Suggested covers on import**
- [ ] When importing Kindle clippings, search for covers via title + author (Google Books API or Open Library Covers API)
- [ ] Show suggested cover for user to confirm/change — never auto-apply
- [ ] Always allow manual override

### 🔜 Sprint 10 — Polish + export
- [ ] Empty states for all screens
- [ ] Onboarding flow
- [ ] Export map as image
- [ ] Export book highlights to Markdown / Notion / Obsidian

---

## File structure

```
src/
  components/
    canvas/
      ReadingCanvas.tsx     # React Flow canvas
      BookNode.tsx          # Custom draggable book card
      CanvasToolbar.tsx     # Floating toolbar
    import/
      FileUploader.tsx      # Drag & drop file input
      ImportSummary.tsx     # Post-import stats
    book/
      BookDetailView.tsx    # Slide-in drawer with highlights
      HighlightCard.tsx     # Single highlight card (copy, star)
    layout/                 # (future: AppShell, Sidebar)

  db/
    db.ts                   # Dexie schema + instance
    booksRepository.ts
    highlightsRepository.ts
    canvasRepository.ts     # Will become mapsRepository in Sprint 3

  hooks/
    useImportClippings.ts

  pages/
    ImportPage.tsx          # First-run import screen
    LibraryPage.tsx         # Home / Dashboard (Sprint 3: becomes default)

  types/
    book.ts
    highlight.ts
    canvas.ts               # Will add Map type in Sprint 3

  utils/
    parseKindleClippings.ts
    generateStableId.ts
    exportMarkdown.ts
```

---

## Local development

```bash
cd kindle-map
npm install
npm run dev       # http://localhost:5174
npm run build     # production build
```
