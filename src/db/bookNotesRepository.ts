import { db } from './db';
import { notDeleted } from './softDelete';
import { getLiveBookTitles } from './booksRepository';
import type { BookNote } from '../types/book';

export async function getAllBookNotes(): Promise<BookNote[]> {
  return db.bookNotes.filter(notDeleted).toArray();
}

export type RecentNote = {
  id: string;
  bookId: string;
  text: string;
  /** Raw book title — run through `getDisplayTitle` in the UI, as the app does. */
  bookTitle: string;
  updatedAt: string;
  /** Set when the note hangs off one specific highlight rather than the book. */
  linkedHighlightId?: string;
};

/**
 * Most recently written notes, newest first (Desk — Loci L1). Ordered by
 * `updatedAt`, which the auto-stamp hook bumps on every edit, so this really is
 * "what you last wrote".
 *
 * Tombstoned notes are filtered out. Notes are also dropped when their book is
 * gone: `deleteBook` cascades to highlights and canvas nodes but **not** to
 * `bookNotes` (pre-existing behaviour, unchanged here), so an orphan note can
 * outlive its book — it must not surface as if the source still existed. We
 * over-fetch before that join so dropping orphans cannot return short.
 */
export async function getRecentNotes(limit = 5): Promise<RecentNote[]> {
  const rows = await db.bookNotes
    .orderBy('updatedAt')
    .reverse()
    .filter(notDeleted)
    .limit(limit * 3)
    .toArray();
  if (rows.length === 0) return [];

  const titles = await getLiveBookTitles(rows.map((n) => n.bookId));
  return rows
    .filter((n) => titles.has(n.bookId))
    .slice(0, limit)
    .map((n) => ({
      id: n.id,
      bookId: n.bookId,
      text: n.text,
      bookTitle: titles.get(n.bookId)!,
      updatedAt: n.updatedAt,
      linkedHighlightId: n.linkedHighlightId,
    }));
}

export async function getGeneralBookNote(bookId: string): Promise<BookNote | undefined> {
  return db.bookNotes
    .where('bookId').equals(bookId)
    .and((n) => !n.linkedHighlightId && notDeleted(n))
    .first();
}

export async function upsertGeneralBookNote(bookId: string, text: string): Promise<void> {
  const existing = await getGeneralBookNote(bookId);
  const now = new Date().toISOString();
  if (existing) {
    if (text.trim()) {
      await db.bookNotes.update(existing.id, { text, updatedAt: now });
    } else {
      await db.bookNotes.update(existing.id, { deletedAt: now });
    }
  } else if (text.trim()) {
    const id = `note-${bookId}-general-${Date.now()}`;
    await db.bookNotes.add({ id, bookId, text, createdAt: now, updatedAt: now });
  }
}

export async function getBookNoteByHighlight(
  bookId: string,
  highlightId: string,
): Promise<BookNote | undefined> {
  return db.bookNotes
    .where('bookId').equals(bookId)
    .and((n) => n.linkedHighlightId === highlightId && notDeleted(n))
    .first();
}

export async function upsertBookNote(
  bookId: string,
  highlightId: string,
  text: string,
): Promise<void> {
  const existing = await getBookNoteByHighlight(bookId, highlightId);
  const now = new Date().toISOString();
  if (existing) {
    await db.bookNotes.update(existing.id, { text, updatedAt: now });
  } else {
    const id = `note-${bookId}-${highlightId}-${Date.now()}`;
    await db.bookNotes.add({ id, bookId, linkedHighlightId: highlightId, text, createdAt: now, updatedAt: now });
  }
}

export async function deleteBookNoteByHighlight(
  bookId: string,
  highlightId: string,
): Promise<void> {
  const existing = await getBookNoteByHighlight(bookId, highlightId);
  if (existing) await db.bookNotes.update(existing.id, { deletedAt: new Date().toISOString() });
}
