# KindleMap Design System — v1.0

> Reference for all KindleMap UI work. Copy from here to maintain visual consistency.
> Last updated: Sprint 1 — July 2026

---

## Visual Philosophy

Three words: **calm, editorial, intentional.**

- **Calm**: The app is a reading companion. It should feel like opening a well-designed book or sitting at a clean desk. No visual noise. Space is meaning.
- **Editorial**: Typography-first. Hierarchy comes from weight and size, not color.
- **Intentional**: Every color decision has a reason. Accent appears rarely and always means something.

Feels like: Kindle's focus + Apple's restraint + a high-end literary magazine's confidence.

---

## Typography

**Font**: Inter (system fallback: system-ui, sans-serif). Already available.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Page title | `text-2xl–3xl` | 300 light | `tracking-tight leading-tight` |
| Section header | `text-lg–xl` | 400 | `tracking-tight` |
| Card title | `text-sm–base` | 600 semibold | `leading-snug` |
| Body | `text-sm` | 400 | `leading-relaxed` |
| Secondary body | `text-sm` | 300 light | `text-[--text-2]` |
| Label / eyebrow | `text-[10px]–[11px]` | 700 bold | `uppercase tracking-[0.15em]` |
| Mono / metadata | `text-xs` | 400 | `font-mono` |

---

## Color Tokens

```css
:root {
  /* Backgrounds */
  --bg:           #F8F6F2;   /* bone white — warm, paper-like */
  --surface:      #FFFFFF;   /* cards, modals */
  --surface-2:    #F2F0EC;   /* nested cards, subtle areas */
  --canvas-bg:    #EDEAE4;   /* reading canvas — physical desk feel */

  /* Brand — Night Blue */
  --brand:        #1C2B3A;   /* identity: logo, primary buttons */
  --brand-mid:    #2C4159;   /* hover on dark surfaces */
  --brand-soft:   rgba(28,43,58,0.07);
  --brand-border: rgba(28,43,58,0.12);

  /* Accent — Restrained Blue */
  --accent:       #3D6B8E;   /* active states, links, selection, focus */
  --accent-soft:  rgba(61,107,142,0.10);
  --accent-border: rgba(61,107,142,0.20);

  /* Warm — Micro accent (replaces amber/orange as identity) */
  --warm:         #C4894A;   /* active tool, focus rings, tiny highlights ONLY */
  --warm-soft:    rgba(196,137,74,0.12);

  /* Text */
  --text:         #181614;   /* ink black with warmth */
  --text-2:       #5C5650;   /* warm charcoal, secondary */
  --text-3:       #9C9590;   /* labels, placeholders, metadata */

  /* Borders */
  --border:       rgba(24,22,20,0.07);
  --border-md:    rgba(24,22,20,0.13);
  --border-strong: rgba(24,22,20,0.22);

  /* Status */
  --status-reading:  #3D6B8E;   /* same as --accent */
  --status-finished: #3A7A5C;   /* forest green */
  --status-want:     #7A6A54;   /* warm brown-gray */

  /* Canvas node tints */
  --node-book:   #FFFFFF;
  --node-topic:  #EEF2F7;
  --node-note:   #F7F4EE;
  --node-quote:  #F2F0F7;
}
```

### Color Rules

| Color | Use | Never use for |
|---|---|---|
| `--brand` (#1C2B3A) | Logo, primary CTA buttons, navbar logo area | Body backgrounds mid-page |
| `--accent` (#3D6B8E) | Active filters, focus rings, selected state, links | Drawing tool active state |
| `--warm` (#C4894A) | Active drawing/canvas tool indicator, handle glow | Identity, buttons, text |
| Orange (`orange-*`) | Attention/warning states only | Brand or UI chrome |
| Red | Destructive confirm only | Any other use |

---

## Spacing & Layout

| Use | Value |
|---|---|
| Tight (labels, gaps) | `gap-1` – `gap-2` |
| Card internals | `p-4` – `p-5` |
| Comfortable sections | `p-6` – `p-8` |
| Page padding | `px-6 py-8` |
| Content max-width | `max-w-5xl mx-auto` |

### Radius

| Element | Radius |
|---|---|
| Cards, modals | `rounded-xl` or `rounded-2xl` |
| Buttons, pills | `rounded-full` or `rounded-lg` |
| Inputs | `rounded-lg` |
| Canvas nodes | `rounded-xl` or `rounded-2xl` |
| Tooltips, menus | `rounded-lg` |

### Shadows

```
shadow-sm  → subtle card
shadow-md  → hover state
shadow-lg  → modals, floating panels
```

Selected node: `ring-2 ring-[#3D6B8E]/40`

---

## Component Rules

### Library Cards
- White surface, `rounded-2xl`, `shadow-sm`, `border-[--border-md]`
- Hover: stronger border, `shadow-md` — no scale
- Title hover: `group-hover:text-[#3D6B8E]`
- Highlight badge: `bg-stone-100 text-stone-600`

### BookDetailView
- Panel: `bg-[#F8F6F2]` shell, `bg-white` header
- Source label: `text-[#3D6B8E]` (accent, not amber)
- Tabs: underline `border-b-2 border-[#1C2B3A]` on active, not filled pill
- Important filter active: `bg-[#3D6B8E] text-white`
- Focus inputs: `focus:border-[#3D6B8E] focus:ring-[#3D6B8E]/10`
- Study button: `bg-[#3D6B8E]/10 text-[#3D6B8E]`

### Status Pills
```
want-to-read: bg-[#7A6A54]/10 text-[#7A6A54] border-[#7A6A54]/20
reading:      bg-[#3D6B8E]/10 text-[#3D6B8E] border-[#3D6B8E]/20
finished:     bg-[#3A7A5C]/10 text-[#3A7A5C] border-[#3A7A5C]/20
```

### Buttons

| Variant | Style |
|---|---|
| Primary | `bg-[#1C2B3A] text-white rounded-lg hover:bg-[#2C4159]` |
| Secondary | `border border-stone-200 text-stone-600 hover:bg-stone-50` |
| Ghost | `text-stone-500 hover:bg-stone-100 rounded-lg` |
| Destructive | `bg-red-50 text-red-600 hover:bg-red-100` |
| Active filter | `bg-[#1C2B3A] text-white` |

### Canvas Toolbar
- Default icon: `text-stone-400`
- Active node tool (book, topic, etc.): `bg-[#1C2B3A] text-white`
- Active draw tool (pencil, marker, eraser): `bg-[#C4894A]/15 text-[#C4894A]`

### Canvas Handles
- Color: `#C4894A` (warm) — not amber-500
- Glow: `box-shadow: 0 0 0 2px #C4894A55`

### Canvas Nodes (selected)
- `ring-2 ring-[#3D6B8E]/50 shadow-lg`

### Drawing Color Picker
Colors (left to right): `#FFFFFF`, `#181614`, `#ef4444`, `#3b82f6`, `#10b981`, `#C4894A`, `#8b5cf6`
Selected ring: `#C4894A`

### Modals
- Backdrop: `bg-black/30 backdrop-blur-sm`
- Panel: `bg-white rounded-2xl shadow-2xl`
- Focus inputs: accent blue ring

### Stats Cards
- Number: `text-3xl font-light text-[#1C2B3A]`
- Label: `text-[10px] uppercase tracking-[0.15em] text-stone-400 font-bold`

### Status Progress Bars
- want-to-read: `bg-[#7A6A54]`
- reading: `bg-[#3D6B8E]`
- finished: `bg-[#3A7A5C]`

---

## Animation Rules

- Hover transitions: `transition-all duration-150` (Tailwind)
- Modal entry: `opacity 0→1, y 8→0`, `duration: 0.25s`
- No bounce/spring exaggeration
- No scale on cards (only on cover cards in Sprint 2)
- Canvas interactions: instant (0 delay)

---

## What NOT to change in Sprint 1

- Canvas node structure or behavior
- React Flow edge styles (functional)
- Drawing layer logic
- Data models
- Study Mode, Export, Import screens (beyond basic token alignment)
- Any feature functionality

---

## Implementation Checklist (Sprint 1)

- [x] CSS tokens in index.css
- [x] Canvas handle color → warm
- [x] Canvas edge selected color → accent blue
- [x] LibraryPage header, cards, filters, buttons
- [x] BookDetailView status pills, tabs, inputs, source label
- [x] StatsPage stat cards, status bars
- [x] MapsPage buttons, map cards
- [x] BookNode selected ring → accent blue
- [x] CanvasLeftToolbar active colors
- [x] ReadingCanvas canvas bg, drawing colors (add white)
