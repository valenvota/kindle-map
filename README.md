# Loci

> Turn dispersed reading into knowledge with **shape, place, and context.**

Loci helps you transform highlights, notes, and source material from books, PDFs and
articles into knowledge you can actually see, connect, and reuse. The core arc is
*dispersed material → knowledge with shape → your own thinking* — it's not just a
highlights library, and not just a mind map.

> Loci is the current product direction. It grew out of an earlier stage called
> **KindleMap**; the repository is still named `kindle-map` and some internal
> table/type names (e.g. `maps`) are unchanged on purpose to avoid churn.

## The model

- **Desk** — where you return: what you were recently thinking about.
- **Library** — where source material lives (books, PDFs, articles). Find, filter, sort.
- **Locus** — your spatial workspace, where knowledge gets shaped.
- **Room** — a context inside your Locus (Reading, University, Writing…). Rooms nest.

One line: *Library stores it. Locus shapes it. Desk is where you come back to it.*

## Principles

- **Local-first / offline-first.** Everything works in the browser with no account.
- **Login is optional and progressive** (backup/sync is planned, never forced).
- Data lives in **IndexedDB via Dexie**.

## Where to read more (source-of-truth docs)

| Doc | What it is |
|---|---|
| `LOCI_OPERATING_CONTEXT.md` | Start here — the operating brief (identity, status, rules). |
| `LOCI_PIVOT.md` | North star: product model, architecture, migration. |
| `LOCI_ROADMAP.md` | Phased roadmap (L1…L8 + long-term). |
| `DESIGN_SYSTEM.md` | Visual system (shipped). |
| `BACKEND_SPIKE.md` | Backend / sync architecture decision (currently paused). |
| `SETUP.md` | Cross-machine setup + git workflow. |
| `REDESIGN_PLAN.md` | Historical implementation record (not the current north star). |

## Stack

React + TypeScript · Vite · Tailwind CSS v4 · @xyflow/react (canvas) ·
Dexie.js / IndexedDB · Framer Motion · Lucide · html-to-image · deploy on Vercel.
Fonts (Inter + Newsreader) self-hosted via `@fontsource-variable`.

## Development

```bash
npm ci
npm run dev     # http://localhost:5174
npm run build   # production build
```

Full setup and the multi-machine git workflow live in `SETUP.md`.
