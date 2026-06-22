import { db } from './db';
import type { Book } from '../types/book';

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
  const existing = await db.books.get(book.id);
  if (existing) {
    await db.books.update(book.id, {
      // Preserve manual edits; update counts and timestamps
      totalHighlights: book.totalHighlights,
      updatedAt: book.updatedAt,
    });
  } else {
    await db.books.add(book);
  }
}

export async function getAllBooks(): Promise<Book[]> {
  return db.books.orderBy('title').toArray();
}

export async function getBook(id: string): Promise<Book | undefined> {
  return db.books.get(id);
}

export async function updateBookHighlightCount(bookId: string): Promise<void> {
  const count = await db.highlights.where('bookId').equals(bookId).count();
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

export async function updateBookCover(id: string, coverImage: string | null): Promise<void> {
  await db.books.update(id, {
    coverImage: coverImage ?? undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBook(id: string): Promise<void> {
  await db.transaction('rw', db.books, db.highlights, db.canvasNodes, async () => {
    await db.books.delete(id);
    await db.highlights.where('bookId').equals(id).delete();
    await db.canvasNodes.where('bookId').equals(id).delete();
  });
}
