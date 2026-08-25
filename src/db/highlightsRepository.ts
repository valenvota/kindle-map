import { db } from './db';
import { notDeleted } from './softDelete';
import { getLiveBookTitles } from './booksRepository';
import type { Highlight } from '../types/highlight';

export async function upsertHighlight(highlight: Highlight): Promise<'created' | 'exists'> {
  // Raw get — an existing row may be a tombstone.
  const existing = await db.highlights.get(highlight.id);
  if (existing) {
    // Re-importing revives a soft-deleted highlight (part of reviving its book).
    if (existing.deletedAt) {
      await db.highlights.update(highlight.id, { deletedAt: undefined });
      return 'created';
    }
    return 'exists';
  }
  await db.highlights.add(highlight);
  return 'created';
}

export async function getAllHighlights(): Promise<Highlight[]> {
  return db.highlights.filter(notDeleted).toArray();
}

export async function getHighlightsByBook(bookId: string): Promise<Highlight[]> {
  return db.highlights.where('bookId').equals(bookId).and(notDeleted).sortBy('location');
}

export async function toggleImportant(id: string, important: boolean): Promise<void> {
  await db.highlights.update(id, { important, updatedAt: new Date().toISOString() });
}

export type RecentMarkedHighlight = {
  id: string;
  bookId: string;
  text: string;
  /** Raw book title — run through `getDisplayTitle` in the UI, as the app does. */
  bookTitle: string;
  /** Kindle page / location, when the clipping carried one. */
  page?: string;
  location?: string;
  updatedAt: string;
};

/**
 * Highlights the user **marked important**, most recently marked first (Desk —
 * Loci L1).
 *
 * Deliberately keyed on the marking, not on the import: a Kindle import stamps
 * every highlight at once, so "recently imported" is an arbitrary slice of one
 * batch and says nothing personal. `toggleImportant` bumps `updatedAt`, so this
 * ordering really is "what you last singled out".
 *
 * Tombstoned highlights are excluded, and rows are dropped if their book is gone
 * (defensive: `deleteBook` does tombstone a book's highlights, but an orphan must
 * never render as if its source still existed). We over-fetch before that join so
 * dropping orphans cannot return short.
 */
export async function getRecentMarkedHighlights(limit = 5): Promise<RecentMarkedHighlight[]> {
  const rows = await db.highlights
    .orderBy('updatedAt')
    .reverse()
    .filter((h) => notDeleted(h) && h.important === true)
    .limit(limit * 3)
    .toArray();
  if (rows.length === 0) return [];

  const titles = await getLiveBookTitles(rows.map((h) => h.bookId));
  return rows
    .filter((h) => titles.has(h.bookId))
    .slice(0, limit)
    .map((h) => ({
      id: h.id,
      bookId: h.bookId,
      text: h.text,
      bookTitle: titles.get(h.bookId)!,
      page: h.page,
      location: h.location,
      updatedAt: h.updatedAt,
    }));
}
