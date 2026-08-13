# KindleMap — Backend Architecture Spike

> Roadmap item 7. A **decision + deep design spec**, not an implementation.
> No code ships from this doc; the app stays offline-first with no backend until a
> future sprint executes the plan below. Read alongside `REDESIGN_PLAN.md`.
>
> **Decision:** **Supabase** (Postgres + Auth + RLS + Storage) with a deliberately
> minimal, single-user **last-write-wins (LWW) sync** layer. Dexie Cloud is the
> documented fallback; Firestore is rejected; PowerSync/ElectricSQL are parked.
> Rollout is phased so **backup ships before sync**, and login is **optional and
> progressive** — the app is fully usable, forever, with no account.
>
> **Status (2026-08):** the local groundwork is **shipped** — Dexie is at **v11**,
> and **Phase A1 (sync-ready schema + auto-stamp) and A2 (soft-delete tombstones)**
> are done, still 100% offline with nothing user-visible. **Phase B (Supabase
> project + Auth + schema/RLS) is paused** until we choose to resume backend work.
> The architecture decision below is unchanged.

---

## 1. Context & goals

Loci is local-first today: all data lives in **IndexedDB via Dexie (v11)**,
per browser. There is no backend. The practical consequence the user already
feels: **data does not move between their PC and their Mac** — GitHub syncs the
*code*, not the *library*. Each browser is an island.

The spike answers: **what is the lowest-friction path from local-first IndexedDB
to multi-device backup + sync, without breaking offline-first or the relational
model, and with a clean path to Google login, freemium, and a future AI layer?**

### Product priorities (from the user, they anchor every trade-off)

1. **Optional, progressive login** — never forced upfront.
2. The app **must be fully usable locally with no account**, forever.
3. **After importing highlights**, offer a non-blocking choice:
   1. Keep on this device
   2. Create / sign in to an account for **backup and sync**
4. The account option must **also** be reachable later in Settings / Profile.
5. **Local-first and offline are mandatory**, not a nice-to-have.
6. **Low cost** matters (personal project; free tier should be comfortable).
7. **Solo-dev simplicity** matters; **avoid overengineering.**
8. Future needs to keep the door open for: **backup, multi-device sync,
   freemium, and AI** (later).
9. Slight preference for **Postgres / Supabase** — but compare honestly.

### What the data actually looks like (grounds the design)

8 Dexie tables, all rows keyed by a string `id`, all carrying `createdAt` /
`updatedAt` ISO timestamps (except `canvasStrokes`/`canvasEdges` which carry only
`createdAt` today — see §6.3):

| Table | Shape notes | Heavy fields |
|---|---|---|
| `books` | relational root | `coverImage` = base64 **data URI** |
| `highlights` | FK `bookId` | `text`, `rawMetadata` (can be long) |
| `bookNotes` | FK `bookId` | `text` |
| `maps` | canvas root | — |
| `canvasNodes` | FK `mapId`, `bookId`, `highlightId` | image nodes store a **data URI** in `content` |
| `canvasEdges` | FK `mapId`, `source`, `target` | — |
| `canvasStrokes` | FK `mapId` | `points[]` (large arrays) |
| `groups` | legacy, effectively unused | — |

Three facts that shape everything below:

- **No `userId` anywhere.** Per-row ownership is *the* schema addition sync needs.
- **Relational**: `mapId` / `bookId` / `highlightId` foreign keys → a relational
  store (Postgres) fits naturally; a document store would force denormalization.
- **Heavy blobs**: `coverImage`, image-node `content`, and `strokes.points`.
  These stress payload size and storage, and directly kill some options (see §3).
- **Scattered writes**: repositories exist under `src/db/*Repository.ts`, but ~12
  files write to `db` directly and 9 components read via `useLiveQuery` on `db.*`.
  A clean sync layer wants a single write choke-point. Mitigation in §6.4.

---

## 2. Evaluation criteria (weighted)

| # | Criterion | Weight | Why |
|---|---|---|---|
| C1 | Offline-first / local-first correctness | ★★★ | Mandatory (priority 5) |
| C2 | Solo-dev simplicity, low overengineering | ★★★ | Priorities 7 |
| C3 | Relational fit (8 FK-linked tables) | ★★★ | Avoids a rewrite; priority 9 |
| C4 | Progressive/optional auth, claim-local-data | ★★★ | Priorities 1–4 |
| C5 | Future server-side compute (AI, stats, sharing) | ★★ | Priorities 8 |
| C6 | Cost at hobby scale + path to freemium | ★★ | Priorities 6, 8 |
| C7 | Blob handling (data URIs, stroke arrays) | ★★ | Data reality |
| C8 | Lock-in / portability | ★ | Long-term hygiene |

---

## 3. Candidates — honest comparison

The roadmap framed this as "Supabase vs Firebase." That framing is too narrow:
KindleMap is already all-in on **Dexie**, and there are purpose-built local-first
sync engines. So the real candidate set is four options.

### A. Supabase — Postgres + Auth + RLS + Storage, **DIY sync** ✅ recommended

- **C1** ✅ Dexie stays the local source of truth; sync is an add-on layer, so
  offline is unaffected and the app degrades to today's behavior with no backend.
- **C2** ⚠️ The one real cost: **we write the sync layer.** Mitigated hard by
  keeping it *single-user LWW* (see §5) — a much smaller problem than multiplayer.
- **C3** ✅✅ 8 tables → 8 Postgres tables; FKs, JSONB for nested fields. Perfect fit.
- **C4** ✅✅ Supabase Auth does anonymous sessions, Google OAuth, email — and
  **identity linking** (anon → Google keeps the same `uid`), which is exactly the
  "claim local data on sign-in" flow. RLS (`user_id = auth.uid()`) secures rows.
- **C5** ✅✅ A real queryable Postgres we control → server-side AI enrichment
  jobs, Stats v2 aggregates, shareable pages, plan enforcement. Edge Functions +
  pgvector (for the AI layer's embeddings) are first-party. **This is the decisive
  future advantage.**
- **C6** ✅ Free tier: 500 MB DB, 1 GB storage, 50k MAU, 5 GB egress. Pro is
  $25/mo when freemium demands it. (Caveat: free projects **pause after ~1 week of
  inactivity** — fine for an actively-developed app; noted as a risk in §8.)
- **C7** ✅ Blobs inline as `text` to start; offload to **Supabase Storage**
  (hash-keyed) when storage grows. Strokes as JSONB.
- **C8** ⚠️ Some lock-in to Supabase Auth/RLS, but the data is plain Postgres —
  the most portable option here (pg_dump walks out the door).

### B. Firebase / Firestore — ❌ rejected

- **C1** ✅ Best-in-class built-in offline persistence (local-first "for free").
- **C4** ✅ The canonical progressive flow: anonymous auth → `linkWithCredential`
  to Google, data preserved. (Firestore genuinely nails this UX.)
- **C3** ❌ **Document store fights the relational model.** Our FK graph
  (map→nodes→books→highlights) becomes denormalized collections + fan-out reads.
- **C7** ❌ **1 MB per-document hard limit.** A single `coverImage` data URI or a
  dense `strokes.points` array can exceed it → forced Storage offload *and* a
  re-modeling tax from day one.
- **C5** ⚠️ Server-side analytics/AI over NoSQL is clumsier than SQL; no
  pgvector-equivalent that's as clean for the planned AI layer.
- **C8** ❌ Highest lock-in; data export is painful.
- **Verdict:** the offline story is great, but the relational mismatch + 1 MB
  limit + weaker server-side-compute story lose against our data shape and future.

### C. Dexie Cloud — strong runner-up / fallback

- **C1/C2** ✅✅ **Native to our exact stack.** Add `dexie-cloud-addon`, mark
  tables synced, get offline-first sync + access control + built-in auth with
  *almost no sync code*. This is the "avoid overengineering" sweet spot and the
  **fastest path to working sync.**
- **C3** ✅ Syncs Dexie tables as-is; no re-modeling.
- **C4** ✅ Has its own auth (OTP email); Google is possible via custom auth but
  less turnkey than Supabase.
- **C5** ❌ **The dealbreaker for our roadmap:** data lives in Dexie Cloud's
  managed store — **no general SQL surface we control** for server-side AI, Stats
  v2, or sharing pages. We'd be building the AI/stats/sharing future *around* an
  opaque sync backend.
- **C6** ⚠️ Free tier is small (a few production users); pricing is per-user →
  fine for personal use, tighter for freemium at scale.
- **C8** ⚠️ Lock-in to Dexie's sync protocol/vendor.
- **Verdict:** if the DIY sync in Option A ever becomes a maintenance burden,
  Dexie Cloud is a legitimate *v1 shortcut* — but it boxes in the AI/stats/sharing
  future, so it's the fallback, not the target.

### D. PowerSync / ElectricSQL on Supabase Postgres — parked

- Managed local-first sync engines that mirror Postgres ↔ a local store with
  correct offline + conflict handling **without writing the sync layer** — keeping
  Supabase Postgres as the source of truth (best-of-both on paper).
- **❌ Big architectural cost now:** their web SDKs use their **own local SQLite
  (wa-sqlite)**, not Dexie/IndexedDB. Adopting one means **replacing Dexie as the
  local store** (or running two local stores) — a major migration for a solo dev,
  against priorities 2 & 7.
- **Verdict:** powerful and worth revisiting **if** DIY LWW sync outgrows us
  (real concurrency, many devices). Not now. Documented as the escape hatch.

### Scorecard

| | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 |
|---|---|---|---|---|---|---|---|---|
| **A. Supabase + DIY LWW** | ✅ | ⚠️ | ✅✅ | ✅✅ | ✅✅ | ✅ | ✅ | ⚠️ |
| B. Firestore | ✅ | ✅ | ❌ | ✅ | ⚠️ | ✅ | ❌ | ❌ |
| C. Dexie Cloud | ✅✅ | ✅✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | ⚠️ |
| D. PowerSync/Electric | ✅ | ⚠️ | ✅✅ | ✅ | ✅✅ | ✅ | ✅ | ⚠️ |

**Recommendation: A (Supabase + minimal DIY LWW sync).** It's the only option that
satisfies the *future* (Postgres-backed AI/stats/sharing/freemium) and the
*Postgres preference* while keeping Dexie and offline-first intact. Its single
weakness — hand-written sync — is neutralized by scoping sync to the genuinely
easy case: **one user, a handful of devices, rare concurrent edits.**

---

## 4. The anti-overengineering principle

KindleMap's sync problem is **not** Google Docs. It is:

> one human, 2–3 of their own devices, editing mostly one-at-a-time, who wants
> their library backed up and mirrored.

That means we can deliberately **not build**: real-time collaboration, CRDTs,
operational transforms, field-level 3-way merge, presence, or a bespoke conflict
UI. The correct model is **whole-row last-write-wins keyed on `updatedAt`**, with
soft-delete tombstones. If two devices edit the *same row* while both offline, the
later `updatedAt` wins and the other row's edits to that row are lost — an
acceptable, well-understood trade for a personal tool, and documented to the user.

Everything in §5–§6 follows from picking the smallest model that works.

---

## 5. Sync design (the deep spec)

### 5.1 Ownership & the local-first identity model

To honor "fully usable offline with no account" **and** a clean claim-on-signin,
identity is **two-phase**:

- **Phase 1 — anonymous local (default, zero backend contact):** on first launch
  generate a `localOwnerId` (UUID) in `localStorage`. Every row is stamped
  `ownerId = localOwnerId`. **No network call, no anonymous MAU burned, works on a
  plane.** This is strictly better than Supabase anonymous *sessions* for our
  priorities (those need a network round-trip on first launch and count against
  MAU).
- **Phase 2 — claim on sign-in (opt-in):** when the user creates/links an account
  (Google or email via Supabase Auth), we get a real `auth.uid()`. **Claim** =
  rewrite `ownerId` on all local rows from `localOwnerId` → `uid`, then push. From
  then on `ownerId === uid` and RLS applies.

Edge case — **signing in on two devices that each hold local data**: claim is a
**union by `id`** with LWW on any `id` collisions (collisions are near-impossible
given per-device UUID id generation, but LWW handles them deterministically).

### 5.2 Change tracking without an outbox

We do **not** need a separate outbox table. LWW-by-timestamp lets us compute dirty
rows by scanning:

- **Push set** = local rows where `updatedAt > lastPushedAt` (per table).
- **Pull set** = server rows where `updatedAt > lastPulledAt` (per table).
- Cursors `lastPushedAt` / `lastPulledAt` live in a small local `syncState` record.

This is the simplest correct design and adds **no** new table. (An outbox is only
worth it if we needed guaranteed per-mutation ordering or partial-field merge —
we don't.)

### 5.3 Deletes → tombstones

Hard deletes can't propagate ("row is gone" is indistinguishable from "row never
synced"). So synced tables get a soft-delete: set `deletedAt` (ISO) instead of
removing the row; the UI filters out `deletedAt != null`. Tombstones sync like any
row. A later server-side job can purge tombstones older than N days.

### 5.4 The sync loop

```
push():  for each table: upload rows where updatedAt > lastPushedAt
         (server upserts by id, keeping the row with the greater updatedAt)
pull():  for each table: fetch rows where updatedAt > lastPulledAt AND owner = uid
         apply locally, resolving id collisions by greater updatedAt
```

- **Triggers:** on app focus/visibility change, after a debounced local write, and
  a manual "Sync now" button. **No realtime subscription in v1** (pull-on-focus is
  enough for personal multi-device; realtime is an easy additive upgrade later).
- **Atomicity:** apply a pull inside a Dexie transaction so a partial pull can't
  corrupt local state.
- **Clock skew:** device clocks drive `updatedAt`. For a single user this is fine;
  to be safe, the server can stamp its own `server_updated_at` on upsert and pull
  can use that as the authority. Documented as a v1.1 hardening, not v1 blocker.

### 5.5 Blobs

- **v1:** keep `coverImage` / image-node `content` inline (Postgres `text`),
  strokes as `jsonb`. Simplest; works within the free tier for a personal library.
- **Later:** offload large blobs to **Supabase Storage**, keyed by content hash;
  store the object path in the row and sync only the path. Triggered by storage
  pressure or the freemium sprint (plan-based quotas). Reuses the existing
  `utils/downscaleImage.ts` compression.

---

## 6. Schema & app changes required (spec, not code)

### 6.1 Postgres schema (Supabase)

- One table per Dexie table (`books`, `highlights`, `book_notes`, `maps`,
  `canvas_nodes`, `canvas_edges`, `canvas_strokes`; drop the unused `groups`).
- Columns mirror the TS types; nested objects (`position`, `style`, `points`,
  `tags`) as `jsonb`; timestamps as `timestamptz`.
- Every table: `owner uuid not null`, `updated_at timestamptz not null`,
  `deleted_at timestamptz null`.
- **RLS** on every table: `using (owner = auth.uid())` for select/update/delete,
  `with check (owner = auth.uid())` for insert. This is the entire security model.
- Indexes: `(owner, updated_at)` per table (drives the pull query).

### 6.2 Dexie schema (a real, minimal migration — the only forced code change)

A single new Dexie version that adds three conventions to synced tables:

- `ownerId: string` (stamped from `localOwnerId` for legacy rows in the upgrade).
- `updatedAt: string` — **backfill** `canvasStrokes` / `canvasEdges`, which lack
  it today, from `createdAt`.
- `deletedAt?: string` (optional; absence ⇒ live).
- No new index strictly required for LWW, but add `updatedAt` to synced stores'
  index list to make the push scan cheap.

This is the first **non-no-op** Dexie migration since v2 — it backfills fields, so
it needs a real `.upgrade()` callback and careful testing (it's reversible: with
no backend, the app behaves exactly as today).

### 6.3 Auto-stamping via Dexie middleware (kills the scattered-writes problem)

Rather than hunt down all ~12 direct-write sites, install **Dexie hooks /
middleware** globally:

- `creating` / `updating` hooks stamp `updatedAt = now` (and `ownerId` if unset)
  on every write to a synced table — automatically, everywhere.
- A delete interceptor converts `.delete()` on synced tables into a soft-delete
  (`deletedAt = now`, `updatedAt = now`). Reads already go through queries we can
  filter for `deletedAt == null`.

This is the elegant, low-effort answer to §1's "scattered writes": one place,
covers all call sites, no repository refactor required. (Repositories can still be
tidied opportunistically, but it's no longer a blocker.)

### 6.4 App / UX changes

- **Auth**: Supabase JS client; anonymous `localOwnerId` by default; sign-in via
  Google (OAuth) or email OTP; identity link = claim (§5.1).
- **Post-import prompt** (priority 3): after `useImportClippings` finishes, a
  calm, **non-blocking** card — "Keep on this device" (dismiss) vs "Back up & sync"
  (opens auth). Never a wall; matches the onboarding's editorial tone.
- **Settings / Profile** (priority 4): a new surface exposing account state, "Sync
  now", last-synced time, sign in/out, and (later) plan/usage. Reachable any time,
  not just post-import.
- **Sync status**: a quiet indicator (idle / syncing / offline / error) — one glyph
  in the shell, not a dashboard.
- **Offline**: with no account or no network, everything works exactly as today;
  sync is purely additive.

---

## 7. Phased rollout (for a FUTURE sprint — not part of this spike)

Ordered so **each phase ships value and is reversible**, and **backup lands before
sync**:

- **Phase A — Local foundation (no backend). ✅ SHIPPED (A1 + A2).** Dexie migration (§6.2) +
  auto-stamp/soft-delete middleware (§6.3) + `ownerId`/`deletedAt`. App still 100%
  offline; nothing user-visible changes. De-risks the data model first.
- **Phase B — Supabase project + Auth + schema/RLS. ⏸ PAUSED.** Provisioned by the user
  (they create the project and supply keys — see §9); schema, RLS, `.env` wiring.
- **Phase C — Backup (one-way push).** "Back up now" uploads all local rows.
  Delivers the "backup" value alone, no pull/conflict complexity yet.
  **Note:** backup is only *legible* to the user through its prompt, so the
  progressive-login UX (Phase E) may need to land **with or just before** this
  phase rather than after — Phase C's push mechanics and E's post-import prompt +
  sign-in are two halves of one shippable "backup" story. Treat C+E as
  co-dependent for the first user-facing release.
- **Phase D — Two-way sync.** Pull + LWW + tombstones + pull-on-focus (§5.4).
  Delivers multi-device (the PC↔Mac pain).
- **Phase E — Progressive-login UX.** Post-import card + Settings/Profile (§6.4).
  (See Phase C note — likely pulled earlier to make backup understandable.)
- **Phase F — Later, per their own sprints.** Blob offload to Storage; freemium
  plan gates (RLS + a `plans` table); server-side AI (Edge Functions + pgvector);
  Stats v2 aggregates; realtime if ever wanted.

Phases A–E are the "sync" sprint(s); F folds into the existing roadmap items 9–12.

---

## 8. Risks & open questions

- **Free-tier project pausing** (~1 week idle) — negligible during active dev; for
  a real user base, Pro. Note before relying on it for a demo.
- **LWW loses concurrent same-row offline edits** — accepted for personal use;
  document it; realtime/field-merge is a later option (D) if it ever bites.
- **Clock skew** — mitigate with server-stamped `server_updated_at` as the pull
  authority (v1.1).
- **Dexie backfill migration** — first non-trivial migration since v2; needs the
  cross-machine test matrix (fresh install, upgrade-from-v10-with-data, two
  devices claiming the same account).
- **Blob growth vs 500 MB free DB** — inline is fine for a personal library;
  watch storage; Storage offload (§5.5) is the release valve.
- **Groups table** — legacy/unused; confirm it can be dropped from the synced set.

---

## 9. What executing the plan will require from the user

- Creating the **Supabase project** and providing its URL + anon key (Claude can't
  create accounts or handle secrets; keys go in `.env`, never committed).
- A Google OAuth client (for Google login) when Phase E wants it.
- Decisions still open before Phase B: email-OTP vs Google-only for v1; whether to
  drop `groups`; whether backup (Phase C) is worth shipping on its own first.

---

## 10. Bottom line

Adopt **Supabase**. Keep **Dexie + offline-first** exactly as-is and add a thin,
**single-user LWW** sync on top — no outbox, no CRDT, tombstones for deletes,
auto-stamped via Dexie middleware. Identity is **anonymous-local by default,
claimed on optional sign-in**, so the app is forever usable with no account and
login is progressive. Ship **backup before sync**. This satisfies every stated
priority, honors the Postgres preference, and leaves the AI / stats / sharing /
freemium future on the most capable and portable foundation — while the one cost
(hand-written sync) is contained by refusing to solve a problem harder than the
one KindleMap actually has.
