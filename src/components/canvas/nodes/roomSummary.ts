// Room content summary (Loci L2.2) — pure formatting, no I/O.
//
// Turns a Room's live node mix into a calm one-line summary for its card, e.g.
// "3 notes · 2 books" or "3 notes · 2 books · +3". Kept pure so the taxonomy and
// its idempotency are testable off a browser; ReadingCanvas derives the counts
// from the existing live node data and calls buildRoomSummary.

import type { CanvasNodeData } from '../../../types/canvas';

export type RoomCategory = 'books' | 'highlights' | 'notes' | 'topics' | 'rooms' | 'images';
export type CategoryCounts = Partial<Record<RoomCategory, number>>;

/** Shown when a Room has no meaningful content (empty, or only scaffolding).
 *  A quiet invitation rather than a blunt "Empty"; styled subtly on the card. */
export const EMPTY_ROOM_SUMMARY = 'No content yet';

// Display/priority order: how ties break, and the reading→shaping intent (source
// material first, then thinking). `text` folds into notes; `shape` and `region`
// are visual scaffolding and are ignored entirely (no category, no +N).
const ORDER: { key: RoomCategory; one: string; many: string }[] = [
  { key: 'books',      one: 'book',      many: 'books' },
  { key: 'highlights', one: 'highlight', many: 'highlights' },
  { key: 'notes',      one: 'note',      many: 'notes' },
  { key: 'topics',     one: 'topic',     many: 'topics' },
  { key: 'rooms',      one: 'room',      many: 'rooms' },
  { key: 'images',     one: 'image',     many: 'images' },
];

/** Map a canvas node type to a content category, or null for scaffolding. */
export function categoryForType(type: CanvasNodeData['type']): RoomCategory | null {
  switch (type) {
    case 'book':  return 'books';
    case 'quote': return 'highlights';
    case 'note':  return 'notes';
    case 'text':  return 'notes';   // a text box is a lightweight note
    case 'topic': return 'topics';
    case 'room':  return 'rooms';   // nested Rooms count as content
    case 'image': return 'images';
    // 'shape' | 'region' → visual scaffolding, deliberately uncounted
    default:      return null;
  }
}

/**
 * Compact content summary: the two largest categories (count desc, ties by the
 * priority order above), plus `+N` for the remaining meaningful items in any
 * further categories. `+N` never includes scaffolding. A Room with no meaningful
 * content — empty, or only shapes/regions — reads "Empty".
 */
export function buildRoomSummary(counts: CategoryCounts): string {
  const present = ORDER
    .map((cat, index) => ({ cat, index, n: counts[cat.key] ?? 0 }))
    .filter((e) => e.n > 0)
    .sort((a, b) => b.n - a.n || a.index - b.index);

  if (present.length === 0) return EMPTY_ROOM_SUMMARY;

  const shown = present.slice(0, 2);
  const hiddenTotal = present.slice(2).reduce((sum, e) => sum + e.n, 0);

  const parts = shown.map((e) => `${e.n} ${e.n === 1 ? e.cat.one : e.cat.many}`);
  if (hiddenTotal > 0) parts.push(`${hiddenTotal} more`);
  return parts.join(' · ');
}
