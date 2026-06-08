import { db } from './db';
import type { Highlight } from '../types/highlight';

export async function upsertHighlight(highlight: Highlight): Promise<'created' | 'exists'> {
  const existing = await db.highlights.get(highlight.id);
  if (existing) return 'exists';
  await db.highlights.add(highlight);
  return 'created';
}

export async function getHighlightsByBook(bookId: string): Promise<Highlight[]> {
  return db.highlights.where('bookId').equals(bookId).sortBy('location');
}

export async function toggleImportant(id: string, important: boolean): Promise<void> {
  await db.highlights.update(id, { important, updatedAt: new Date().toISOString() });
}
