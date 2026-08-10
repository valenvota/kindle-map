import { db } from './db';
import { notDeleted } from './softDelete';
import type { Book, ReadingStatus } from '../types/book';

export async function createBook(
  data: Pick<Book, 'title'> & Partial<Pick<Book, 'author' | 'description' | 'tags' | 'color'>>,
): Promise<Book> {
  const now = new Date().toISOString();
  const book: Book = {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: 'manual',
    totalHighlights: 0,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  await db.books.add(book);
  return book;
}

export async function upsertBook(book: Book): Promise<void> {
  // Raw get (not filtered) — an existing row may be a soft-delete tombstone.
  const existing = await db.books.get(book.id);
  if (existing) {
    await db.books.update(book.id, {
      // Preserve manual edits; update counts and timestamps
      totalHighlights: book.totalHighlights,
      updatedAt: book.updatedAt,
      // Re-importing a deleted book revives it (clears the tombstone).
      deletedAt: undefined,
    });
  } else {
    await db.books.add(book);
  }
}

export async function getAllBooks(): Promise<Book[]> {
  return db.books.orderBy('title').filter(notDeleted).toArray();
}

/** Live book count (excludes tombstones). */
export async function countBooks(): Promise<number> {
  return db.books.filter(notDeleted).count();
}

export async function getBook(id: string): Promise<Book | undefined> {
  // Display read — a tombstoned book reads as absent.
  const book = await db.books.get(id);
  return book && notDeleted(book) ? book : undefined;
}

export async function updateBookHighlightCount(bookId: string): Promise<void> {
  const count = await db.highlights.where('bookId').equals(bookId).and(notDeleted).count();
  await db.books.update(bookId, {
    totalHighlights: count,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateBookMetadata(
  id: string,
  patch: Partial<Pick<Book, 'title' | 'author' | 'description' | 'color' | 'tags'>>,
): Promise<void> {
  // Filter out undefined keys so we don't accidentally overwrite with undefined
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Partial<Book>;
  await db.books.update(id, {
    ...clean,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateReadingStatus(id: string, status: ReadingStatus | null): Promise<void> {
  await db.books.update(id, {
    readingStatus: status ?? undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateBookCover(id: string, coverImage: string | null): Promise<void> {
  await db.books.update(id, {
    coverImage: coverImage ?? undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBook(id: string): Promise<void> {
  // Soft delete (tombstone) — the book, its highlights, and its book-nodes on any
  // map. The `updating` hook bumps `updatedAt` on each. Reads filter these out.
  const deletedAt = new Date().toISOString();
  await db.transaction('rw', db.books, db.highlights, db.canvasNodes, async () => {
    await db.books.update(id, { deletedAt });
    await db.highlights.where('bookId').equals(id).modify({ deletedAt });
    await db.canvasNodes.where('bookId').equals(id).modify({ deletedAt });
  });
}
