# Loci — Roadmap

> Forward-looking product roadmap for the **Loci** direction. The *why* and the
> architecture live in `LOCI_PIVOT.md` (the north star); this file is the *sequence*.
> Read alongside `LOCI_PIVOT.md`, `REDESIGN_PLAN.md` (redesign + pre-pivot sprint
> history), `BACKEND_SPIKE.md`, and `SETUP.md`.
>
> **Status:** L1 (the spine) and L2 (Rooms polish) are **shipped**; **L3 — Send to
> Room** is next. Phases beyond L3 remain planning. Each phase is proposed → approved
> → built → verified, one at a time. Do not start a phase without explicit approval.
>
> **Product thesis & sequencing (see `LOCI_PIVOT.md` → "The core loop"):** Loci helps
> people turn what they read into something they can understand, remember, and create
> with. Core loop: **Read → Highlight → Collect → Send to Room → Shape / Transform →
> Remember or Create.** Build order: (1) make the manual loop coherent, (2) widen
> ingestion/reading (native PDF reading + highlight capture), (3) add AI as a shaping
> accelerator. That thesis governs sequencing; the phase order below is being
> re-evaluated against it (the L3 slot in particular).

---

## 0. Strategic transition

- **`LOCI_PIVOT.md` is now the north star.** All product decisions flow from it.
- **Reuse-heavy, not a rewrite.** Locus and Rooms are *maps in a tree*; the existing
  canvas engine, Library, search, and Dexie model are reused.
- **Keep the old Maps fallback during L1.** Locus ships *alongside* the current Maps
  list, never in place of it.
- **Do not delete the previous architecture until Locus is proven.** No removing,
  hiding, or permanently disabling the old Maps access until the new flow is
  validated end to end.

---

## 1. L1 — Loci: The Spine  *(shipped)*

Validate the navigational loop: **Desk → Library → Locus → Room → Back / Search.**

- Rebrand the shell to **Loci**.
- **Desk / Library / Locus** navigation.
- **Root Locus map** (a map with no parent).
- **Existing maps become Rooms** (re-parented under the root).
- **RoomNode references a child `mapId`** (works like BookNode → `bookId`).
- **Enter / exit a Room** (reuse `goToMap`; instant switch first, animate later).
- **Breadcrumb** (`Valentin's Locus / Reading / …`).
- **Desk** = a simple, read-only return surface (recent highlights / notes / Rooms +
  Continue in Locus).
- **Keep the Maps fallback** available and functional throughout.

*Not in L1:* slash menu, AI, connection restyle, deep-nesting UI, PDFs, Collections,
cross-Room movement, zoom animation.

---

## 2. L2 — Rooms polish  *(closed)*

- Create Room.
- Rename / delete Room.
- Better RoomCard previews.
- Empty states.
- Basic nesting UX.
- Better breadcrumbs.

---

## 3. L3 — Send to Room (manual collection)  *(next)*

Close the loop's manual link: **Read → Highlight → Collect → _Send to Room_.** Today
you can already *pull* a Library book/highlight into a Room from inside the Room
(`AddBookModal` / `AddQuoteModal`), but there is no natural **push** from the
reading/source surface — no Library-side "Send to Room", no multi-select, no batch.
Closing that push is the highest-value manual step before AI.

- From the book/highlights (source) surface: **multi-select highlights → Send to
  Room → pick an existing Room →** they appear there as `quote` nodes.
- Reuse the existing quote-node semantics (`AddQuoteModal`); no schema change expected
  (sending content to a Room is just creating nodes on the target map).
- Deterministic per-Room highlight identity: the same highlight may live in different
  Rooms, but cannot be inserted twice into the same Room.

*(The former "slash / creation flow" that occupied L3 moves to a later convenience
slot — see §4.4. Cross-Room **move** / drag-drop / reparenting stays deferred — §5.)*

---

## 4. L4 — Shape into… / AI study notes  (Wow 1)

- Select highlights → **Shape into…**
- Options: outline, diagram, concept map, visual explanation, timeline, comparison,
  questions, summary, study notes — and other study/thinking structures.
- AI is a **contextual tool, not a chatbot** — it helps give shape to the user's
  thinking, it does not replace it. Can be mocked before real AI.
- **Outputs live inside the Room/workspace**, not in a disappearing chat: AI reshapes
  material into a representation the user keeps and can work with.

---

## 4.4 — Slash / creation menu  (convenience & extensibility)

*Relocated here from the old L3.* A `/` command menu on the canvas, designed to be
extensible:

- `/note`, `/room`, `/book`, `/quote`, `/image`, `/source`, `/question`,
  `/summary`, `/concept`.

Deferred to *around/after the AI shaping layer* on purpose: its creation commands
largely duplicate the existing left toolbar / `PlusMenu` and the `AddBook` /
`AddQuoteModal` flows, and its distinctive commands (`/summary`, `/concept`,
`/question`) only become worthwhile once the AI layer (§4) exists. Not a Private
Alpha gate. Not every command needs to ship at once — the system should be extensible.

---

## 4.5 — Private Alpha / First real users

The first moment Loci can go to a small group of real users.

**Entry criteria:**

- Onboarding works.
- Import works.
- Library is stable.
- Locus + Rooms are understandable.
- A *Shape into…* flow exists, even if simple.
- Export works.
- Local data is safe.
- No obvious broken flows.

**Target: 10–20 first users** — students, creators/writers, productivity readers,
people who already use Kindle highlights.

**Validation questions:**

- Do they understand Loci without explanation?
- Can they import highlights?
- Do they understand Library vs Locus vs Room?
- Does *Shape into…* feel valuable?
- Do they come back?
- Would they pay for backup / sync / AI / unlimited Rooms?

---

## 5. L5 — Cross-Room movement

*(The initial Library→Room **push** — "Send to a specific Room" — moved forward to L3.
What remains here is moving content that already exists on a canvas.)*

- Move existing nodes between Rooms.
- Drag / drop a node into a Room.
- Reparenting.

*(Model note: moving a node is just changing its `mapId` — see `LOCI_PIVOT.md`.)*

---

## 6. L6 — Library expansion

- **Native in-product reading (PDF first)** — open and read a PDF *inside* Loci,
  highlight passages while reading, auto-collect those highlights under that source,
  then send them to a Room. This is reading + highlight capture, not just import.
- Articles.
- Apple Books.
- Imported documents.
- Collections / Topics.

*(Reframing note: the loop-critical "Send to Room" link is being pulled ahead of this
phase — see the L3 re-evaluation. Native reading here is about widening the sources
that feed that same link.)*

---

## 7. L7 — Backend Phase B / Auth / Backup / Sync

- Supabase project.
- Auth.
- Schema / RLS.
- Backup.
- Two-way sync.
- Progressive login.
- **Account stays optional** (local-first remains a first-class mode).

*(Foundations already laid: Backend Spike + Phase A1/A2 shipped the sync-ready schema
and soft-delete while staying 100% offline — see `BACKEND_SPIKE.md`.)*

---

## 8. L8 — Sharing / Templates

- Duplicate a Room as a template.
- Export a Room.
- Share a read-only Room.
- Public Room links.

---

## 9. Long-term platform vision  (FUTURE — not near-term roadmap)

> North star, not a plan. Nothing here is scheduled. It exists so near-term
> decisions don't accidentally block it. Full framing in `LOCI_PIVOT.md`.

- **Personal Rooms** — a Room is your own context.
- **Room templates** — a Room's structure becomes a reusable starting point.
- **Shared Rooms** — a Room others can read, study from, or build on.
- **Room marketplace** — creators publish high-quality Rooms (books, courses,
  topics, university subjects, business frameworks, writing systems…).
- **Creator monetization** for premium Rooms.

**Sequencing discipline:** each stage must be *earned* by the previous one. Prove
personal Rooms are valuable → then shared / template Rooms → only then a marketplace.

---

## Where the redesign/sprint history lives

Pre-pivot work (redesign phases 0–4; Sprints 2–4B; Export Lite; Onboarding v1;
Backend Spike + Phase A1/A2) is documented in `REDESIGN_PLAN.md`. That work is the
foundation this roadmap builds on; it is not superseded, just concluded.
