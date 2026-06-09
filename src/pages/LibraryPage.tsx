import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Upload, BookOpen, Search, LayoutDashboard } from 'lucide-react';
import { db } from '../db/db';
import { BookDetailView } from '../components/book/BookDetailView';
import type { Book } from '../types/book';

type Props = {
  onImport: () => void;
  onCanvasView?: () => void;
};

export function LibraryPage({ onImport, onCanvasView }: Props) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [query, setQuery] = useState('');

  const books = useLiveQuery(() => db.books.orderBy('title').toArray(), []);

  const filtered = books?.filter((b) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
              <span className="text-sm font-bold text-white">K</span>
            </div>
            <span className="font-semibold text-stone-900">KindleMap</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search books…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-56 rounded-lg border border-stone-200 py-1.5 pl-9 pr-4 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {onCanvasView && (
              <button
                onClick={onCanvasView}
                className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Canvas</span>
              </button>
            )}
            <button
              onClick={onImport}
              className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Stats row */}
        {books && books.length > 0 && (
          <div className="mb-6 flex items-baseline gap-2">
            <h1 className="text-2xl font-semibold text-stone-900">Your Library</h1>
            <span className="text-sm text-stone-400">{books.length} books</span>
          </div>
        )}

        {/* Empty state */}
        {books && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
              <BookOpen className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-stone-800">No books yet</h2>
            <p className="mt-2 max-w-xs text-sm text-stone-500">
              Import your Kindle highlights to start building your reading map.
            </p>
            <button
              onClick={onImport}
              className="mt-6 flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600"
            >
              <Upload className="h-4 w-4" />
              Import My Clippings.txt
            </button>
          </div>
        )}

        {/* Book grid */}
        {filtered && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
            ))}
          </div>
        )}

        {/* No search results */}
        {filtered && filtered.length === 0 && books && books.length > 0 && (
          <div className="py-16 text-center text-sm text-stone-400">
            No books match "{query}"
          </div>
        )}
      </main>

      {/* Book detail drawer */}
      {selectedBook && (
        <BookDetailView book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-5 text-left transition-all hover:border-stone-300 hover:shadow-md"
    >
      {/* Color accent */}
      <div
        className="mb-4 h-1.5 w-10 rounded-full"
        style={{ backgroundColor: book.color ?? '#f59e0b' }}
      />

      <div className="flex-1">
        <h3 className="font-semibold text-stone-900 leading-snug group-hover:text-amber-700 transition-colors line-clamp-2">
          {book.title}
        </h3>
        {book.author && (
          <p className="mt-1 text-sm text-stone-500 line-clamp-1">{book.author}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
          {book.totalHighlights} highlights
        </span>
        <span className="text-xs text-stone-400 capitalize">{book.source}</span>
      </div>
    </button>
  );
}
