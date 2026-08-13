# Loci — Operating Context

> A **CEO brief** for running the product day to day across chats. This is *not* a
> technical spec and does *not* replace `LOCI_PIVOT.md` or `BACKEND_SPIKE.md`. It is
> the fast way to get any chat (or any Claude session, on any machine) aligned on
> where the product is, how it's run, and who decides what.
>
> Keep this short. Deep detail lives in the source-of-truth docs (§3).

---

## 1. Product identity

- The product is now **Loci**, not KindleMap.
- **KindleMap** was the original technical/product stage — the foundation.
- **Loci** is the new product / brand / UX direction.
- Loci turns dispersed reading material, highlights, and notes into **knowledge with
  shape, place, and context**. Core arc: *dispersed material → knowledge with shape →
  your own thinking.* It is **not** primarily a highlights library, and **not** just
  a mind map.

---

## 2. Core mental model

- **Desk** — where the user returns (home / return surface).
- **Library** — where source material lives.
- **Locus** — where knowledge is shaped (the spatial workspace).
- **Room** — a context inside the Locus.

One-liner: *Library stores it. Locus shapes it. Desk is where you come back to it.*

---

## 3. Source-of-truth docs

| Doc | Role |
|---|---|
| `LOCI_PIVOT.md` | **North star** for the pivot (model, architecture, migration, risks). |
| `LOCI_ROADMAP.md` | **Product roadmap** (phases L1…L8 + long-term vision). |
| `BACKEND_SPIKE.md` | Backend / sync **architecture decision**. |
| `DESIGN_SYSTEM.md` | Visual / design **principles**. |
| `REDESIGN_PLAN.md` | **Historical** implementation record — still useful, no longer the main north star. |
| `SETUP.md` | Cross-machine setup + git workflow. |

---

## 4. Current implementation status

- ✅ Redesign complete (phases 0–4).
- ✅ Canvas creative layer complete (Sprint 4: wallpapers, images, regions).
- ✅ Ink complete (Sprint 4B: pencil/drawing).
- ✅ Export Lite complete (WYSIWYG PNG).
- ✅ Onboarding v1 complete.
- ✅ Backend Phase A1 / A2 complete **locally** (still 100% offline).
- ✅ Soft-delete + sync-ready fields (`ownerId` / `updatedAt` / `deletedAt`) implemented (Dexie v11).
- ✅ `LOCI_PIVOT.md` committed.
- ▶ **Next major product direction: L1 — Loci Spine.** *(Not started.)*
- ⏸ **Supabase Phase B is paused** until we decide to resume backend work.

---

## 5. Current roadmap (summary)

Full detail in `LOCI_ROADMAP.md`.

- **L1** — Loci Spine (Desk / Library / Locus / Room navigation; root Locus map; existing maps become Rooms).
- **L2** — Rooms polish (create/rename/delete, previews, empty states, basic nesting, breadcrumbs).
- **L3** — Slash command / creation flow (`/note`, `/room`, `/book`, …).
- **L4** — Shape into… / AI study notes *(Wow 1; contextual, not a chatbot)*.
- **L4.5** — Private Alpha / first real users (10–20; validate understanding, value, retention, willingness to pay).
- **L5** — Send to Locus / cross-Room movement.
- **L6** — Library expansion (PDFs, articles, Apple Books, imports, Collections).
- **L7** — Backend Auth / Backup / Sync (Supabase Phase B; login optional).
- **L8** — Sharing / templates.
- **Long-term** — Shared Rooms / Room marketplace / creator monetization *(future, not scheduled).*

---

## 6. Operating rules

- **Do not code before proposing a plan and getting approval.**
- **Plan approval is not commit approval** — they are separate gates.
- **Commit / push only after explicit approval.**
- **Keep changes scoped** — one phase / concern at a time.
- **Prefer reuse over rewrite.**
- **Keep the Maps fallback during L1** — Locus ships alongside, not instead of.
- **Do not delete old architecture until Locus is proven.**
- **Keep local-first / offline-first.**
- **Login stays optional / progressive.**

---

## 7. Role separation

- **Board / Strategic HQ chat** — big strategic decisions.
- **CEO / Operating System chat** — day-to-day coordination, prompts, Claude management.
- **Branding chat** — naming, identity, tone, visual direction.
- **Business chat** — monetization, market, GTM, validation.
- **Claude** — strategy support, implementation, technical planning, repo docs, verification.

---

## 8. Decisions that go back to Board / HQ

Not decided unilaterally in a day-to-day chat — escalate:

- Changing roadmap order.
- Cutting or adding major product areas.
- Backend architecture changes.
- Monetization / pricing decisions.
- Naming / brand changes.
- Marketplace / platform decisions.
- Deleting legacy architecture.
- Major data-model changes.
