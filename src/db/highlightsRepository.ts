import { db } from './db';
import { notDeleted } from './softDelete';
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
