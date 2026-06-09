import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, X, BookOpen, CheckCircle2 } from 'lucide-react';
import { db } from '../../db/db';
import { upsertCanvasNode } from '../../db/canvasRepository';

const NODE_WIDTH = 208;
const NODE_HEIGHT = 180;
const GRID_COL_GAP = 40;
const GRID_ROW_GAP = 40;
const COLS = 4;

function nextPosition(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    x: 60 + col * (NODE_WIDTH + GRID_COL_GAP),
    y: 60 + row * (NODE_HEIGHT + GRID_ROW_GAP),
  };
}

type Props = {
  mapId: string;
  existingBookIds: Set<string>;
  existingNodeCount: number;
  onClose: () => void;
};

export function AddBookModal({ mapId, existingBookIds, existingNodeCount, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  const books = useLiveQuery(() => db.books.orderBy('title').toArray(), []);

  const filtered = books?.filter((b) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q);
  });

  const handleAdd = async (bookId: string) => {
    if (existingBookIds.has(bookId) || adding) return;
    setAdding(bookId);
    await upsertCanvasNode({
      id: `${mapId}:${bookId}`,
      mapId,
      bookId,
      type: 'book',
      position: nextPosition(existingNodeCount + existingBookIds.size),
    });
    setAdding(null);
    onClose();
  };

  // Close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: '80vh' }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-base font-semibold text-stone-900">Add book to map</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-stone-100 px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search your library…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        {/* Book list */}
        <div className="flex-1 overflow-y-auto py-2">
          {!filtered || filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-stone-400">
              <BookOpen className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">{query ? `No results for "${query}"` : 'No books in library'}</p>
            </div>
          ) : (
            filtered.map((book) => {
              const alreadyAdded = existingBookIds.has(book.id);
              const isAdding = adding === book.id;

              return (
                <button
                  key={book.id}
                  onClick={() => handleAdd(book.id)}
                  disabled={alreadyAdded || isAdding}
                  className={[
                    'flex w-full items-center gap-3 px-5 py-3 text-left transition-colors',
                    alreadyAdded
                      ? 'cursor-default opacity-40'
                      : 'hover:bg-stone-50 active:bg-stone-100',
                  ].join(' ')}
                >
                  {/* Color dot */}
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: book.color ?? '#f59e0b' }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900">{book.title}</p>
                    {book.author && (
                      <p className="truncate text-xs text-stone-500">{book.author}</p>
                    )}
                  </div>

                  {alreadyAdded ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-amber-600">
                      {isAdding ? 'Adding…' : 'Add'}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
