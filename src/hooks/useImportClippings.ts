import { useState } from 'react';
import { parseKindleClippings, groupByBook } from '../utils/parseKindleClippings';
import { upsertBook } from '../db/booksRepository';
import { upsertHighlight } from '../db/highlightsRepository';
import type { Book } from '../types/book';
import type { Highlight } from '../types/highlight';

export type ImportStats = {
  totalBooks: number;
  newBooks: number;
  totalHighlights: number;
  newHighlights: number;
  skippedBlocks: number;
};

export type ImportState =
  | { status: 'idle' }
  | { status: 'parsing' }
  | { status: 'saving' }
  | { status: 'done'; stats: ImportStats }
  | { status: 'error'; message: string };

export function useImportClippings() {
  const [state, setState] = useState<ImportState>({ status: 'idle' });

  async function importFile(file: File) {
    setState({ status: 'parsing' });

    try {
      const raw = await file.text();
      const { clippings, skipped } = parseKindleClippings(raw);
      const books = groupByBook(clippings);

      setState({ status: 'saving' });

      const now = new Date().toISOString();
      const stats: ImportStats = {
        totalBooks: books.length,
        newBooks: 0,
        totalHighlights: clippings.length,
        newHighlights: 0,
        skippedBlocks: skipped,
      };

      for (const parsedBook of books) {
        const book: Book = {
          id: parsedBook.id,
          title: parsedBook.title,
          author: parsedBook.author,
          source: 'kindle',
          totalHighlights: parsedBook.highlights.length,
          createdAt: now,
          updatedAt: now,
        };

        // upsertBook returns void; we detect "new" by checking existence before
        const existsBefore = await import('../db/db').then(({ db }) => db.books.get(parsedBook.id));
        await upsertBook(book);
        if (!existsBefore) stats.newBooks++;

        for (const c of parsedBook.highlights) {
          const highlight: Highlight = {
            id: c.highlightId,
            bookId: c.bookId,
            type: c.type,
            location: c.location,
            page: c.page,
            addedAt: c.addedAt,
            text: c.text,
            rawMetadata: c.rawMetadata,
            important: false,
            createdAt: now,
            updatedAt: now,
          };

          const result = await upsertHighlight(highlight);
          if (result === 'created') stats.newHighlights++;
        }
      }

      setState({ status: 'done', stats });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  function reset() {
    setState({ status: 'idle' });
  }

  return { state, importFile, reset };
}
