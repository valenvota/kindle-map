# Loci — Design System (v2, shipped)

> The visual source of truth for Loci. This describes the system **actually
> implemented** in `src/index.css`; that file is the canonical token/class source,
> this doc is the reasoning around it. (Historical evolution lives in
> `REDESIGN_PLAN.md` — not needed for day-to-day UI work.)

> **Status — transitional visual direction.** The current editorial/tactile
> language (warm paper, serif display type, tactile cards, wooden Desk) is the
> shipped L1 look, not a final commitment. Once the product structure matures,
> LOCI is likely to undergo a later visual simplification pass toward a cleaner,
> quieter, more neutral aesthetic. Treat everything below as describing what
> exists today, not as a permanent spec — avoid hard-coding these scales/tokens as
> if final.

---

## Philosophy

Three words: **calm, editorial, intentional.**

- **Calm** — a reading companion; space is meaning, no visual noise.
- **Editorial** — typography-first; hierarchy from weight/size, not color.
- **Intentional** — every color has a reason; accent appears rarely and means something.

Locked rules:

- **Serif = content, sans = controls.** Newsreader for reading/content moments,
  Inter for UI. Both self-hosted via `@fontsource-variable`.
- **Paper + ink + one restrained blue accent.** Ember is reserved **only** for the
  "important" marker — never for chrome, buttons, or text.
- **Status is shown by dot + label, not colored fills.**
- **No emoji in the UI.** (The 3 emoji in `utils/exportMarkdown.ts` write into
  exported `.md` files, not the UI, and are intentional.)
- **Near-black warm charcoal sidebar** (serif "Loci" wordmark, no tile mark) **over
  warm paper content**, app-wide. (Shipped state; earlier drafts used a midnight
  ink-blue sidebar.)

---

## Typography

| Role | Family | Notes |
|---|---|---|
| Content / reading / display | `--font-serif` (Newsreader Variable) | titles, quotes, reading surfaces |
| UI / controls / labels | `--font-sans` (Inter Variable) | buttons, nav, metadata, forms |

Use `.font-display` for editorial serif moments.

---

## Color tokens (important ones — `index.css` is canonical)

The full palette, elevation, radii and sidebar scales live in `src/index.css`. The
tokens that matter conceptually:

```css
/* Grounds */
--paper:   #F3F0E9;  /* app background */
--surface: #FBF9F4;  /* cards, sheets, elevated surfaces */
--canvas:  #EEEAE1;  /* reading-desk canvas */

/* Ink (text hierarchy) */
--ink: #1C1A17;  --ink-soft: #5E5B57;  --ink-faint: #9B968D;

/* Accent — the single restrained blue */
--accent: #3E6B8E;  --accent-deep: #2F5470;  --accent-soft/-border (tints)

/* Ember — the important marker ONLY */
--ember: #B06A4F;  --ember-soft (tint)

/* Sidebar — near-black warm charcoal */
--nav-bg-top: #1E1C1A;  --nav-bg-bot: #191715;  --nav-accent: #79A9CE; …
```

Also in `index.css` (not repeated here): `--surface-2`, hairlines
(`--hair`/`-soft`/`-md`), elevation (`--shadow-sm/md/lg/glass/cover`), and radii
(`--radius-sm 8` / `--radius 12` / `--radius-lg 16`).

### Color rules

| Token | Use | Never for |
|---|---|---|
| `--accent` (#3E6B8E) | active/selected state, focus rings, links | destructive; the "important" marker |
| `--ember` (#B06A4F) | the important-highlight marker **only** | chrome, buttons, text, identity |
| ink scale | all text hierarchy | — |
| green / red | success / destructive confirm only (semantic, kept inline) | general UI accent |

> **Backward-compat aliases** (`--bg`, `--brand`, `--warm`, `--text`, `--text-2/3`,
> `--border(-md)`, `--canvas-bg`) remain mapped onto v2 in `index.css` for older
> code paths. Prefer the canonical tokens above in new work; don't reintroduce the
> old v1 values behind them.

---

## Component primitives (in `index.css`)

Use these instead of ad-hoc utility clusters:

- **Buttons** — `.km-btn` with `--primary` / `--secondary` / `--ghost` / `--danger`
  and `--sm` / `--md` / `--lg`; `.km-iconbtn` for icon-only.
- **Forms** — `.km-field`, `.km-label`.
- **Surfaces** — `.km-surface` (`--elevated`), `.km-modal`, `.km-menu`
  (`.km-menu__item`, `--danger`, `__sep`), `.km-glass` for floating chrome.
- **Shell** — `.km-side`, `.km-nav` (charcoal sidebar; `.km-side__word` serif wordmark).
- **Library** — `.lib-*` (masthead + `.lib-sub`, `.lib-section*` shelf header,
  `.lib-card*` source cards, `.lib-dot--{want|reading|finished}`).
- **Covers / canvas** — `.km-cover` (+ `--type` typographic fallback, `--compact`),
  `.km-booknode` (`--cover` / `--card`).

---

## Loci L1 additions (shipped)

Brief — descriptive, not a permanent spec (see the transitional note above):

- **Page headers** — a serif title over a quiet sans subtitle on paper surfaces
  (`.loci-title` / `.loci-sub`; Library keeps its larger `.lib-h1`). Scales are
  what shipped, not a fixed hierarchy.
- **Locus canvas** — editorial in-flow header (`.km-locushdr`), corner-anchored
  chrome, glass zoom pill, and **thin dashed warm-ink edges**.
- **Room card** — a framed "place" object (`.km-roomnode`): warm paper, serif name,
  stacked-paper edge, accent selection ring + soft glow.
- **Desk (intentional exception)** — the Desk renders on a warm **wood** surface
  with its own `--desk-*` ink tokens and header treatment (`.desk*`), deliberately
  *not* the paper-surface header — the dark ground needs its own ink + shadow for
  legibility. This is the one surface that legitimately diverges from the
  paper-and-ink rules above.

---

## Covers & canvas

- **Covers always feel like books:** strict **2:3**, soft shadow, **no square-crop**.
  Typographic fallback cover (Penguin-Great-Ideas style) when there's no image.
- **Canvas = reading desk:** faint dot-grid paper, nodes as paper objects, glass tool
  rail, contextual controls shown **only on selection**.

---

## Motion

- Hover/transition ~150ms; modal entry opacity 0→1 + y 8→0 (~250ms).
- No bounce/spring exaggeration. Canvas interactions instant.

---

## Avoid

Glassmorphism (beyond the one restrained `.km-glass`), neon/AI gradients, generic
SaaS gradients, corporate-dashboard styling, excessive rounding, **emoji in UI**,
and the dead v1 tokens (`--warm` amber `#C4894A`, `#F8F6F2`, `stone-*` utilities).
