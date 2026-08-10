import { db } from './db';
import { notDeleted } from './softDelete';
import type { BookNote } from '../types/book';

export async function getAllBookNotes(): Promise<BookNote[]> {
  return db.bookNotes.filter(notDeleted).toArray();
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
