# KindleMap — Redesign Plan & Roadmap

> Continuity doc for the Apple-inspired redesign. Read alongside `DESIGN_SYSTEM.md`.
> Last updated after Phase 0 (foundation) — commit `a39e4d6`.

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

- **Phase 1 — Library redesign (NEXT)**
  Editorial masthead + serif; stat rail; Covers/Cards `SegmentedControl`; single Filter button/popover
  replacing the chip wall; bookshelf cover grid (2:3 + soft shadow); typographic fallback covers;
  redesigned Cards reading index (representative highlight per row). Build a shared **Cover** component.
  Retire the transitional Library header.

- **Phase 2 — BookDetail** full-screen workspace (identity rail + Highlights/Notes/Study column, serif highlights, ember marker).

- **Phase 3 — Maps / canvas** desk background, paper nodes (BookNode cover + card modes), glass tool rail, contextual toolbar, native context menu. Canvas gets the shell (auto-collapsed).

- **Phase 4 — Stats / Import / Settings** align to the system.

---

## Product roadmap (post-redesign sprints)

1. Visual Redesign / Design System ← *in progress via Phases 0–4 above*
2. Library & Book Visual Modes (Card/Cover toggle; per-node mode in Maps)
3. Canvas Desktop Polish Phase 2 (layer controls; big-shape click-through; resizable elements; text boxes; selection)
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
