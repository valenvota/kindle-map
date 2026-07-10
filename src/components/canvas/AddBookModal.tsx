import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, X, BookOpen, CheckCircle2, Plus } from 'lucide-react';
import { db } from '../../db/db';
import { upsertCanvasNode } from '../../db/canvasRepository';
import { createBook } from '../../db/booksRepository';

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

const ACCENT_COLORS = [
  '#3D6B8E', '#C4894A', '#3b82f6', '#10b981',
  '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16',
];

const INPUT =
  'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 ' +
  'outline-none focus:border-[#3D6B8E] focus:ring-2 focus:ring-[#3D6B8E]/10 ' +
  'placeholder:text-stone-300 bg-white';

type Props = {
  mapId: string;
  existingBookIds: Set<string>;
  existingNodeCount: number;
  onClose: () => void;
};

type View = 'picker' | 'create';

export function AddBookModal({ mapId, existingBookIds, existingNodeCount, onClose }: Props) {
  const [view, setView] = useState<View>('picker');

  return view === 'picker'
    ? <BookPicker mapId={mapId} existingBookIds={existingBookIds} existingNodeCount={existingNodeCount} onClose={onClose} onCreateNew={() => setView('create')} />
    : <CreateBookForm mapId={mapId} existingNodeCount={existingNodeCount} existingBookIds={existingBookIds} onClose={onClose} onBack={() => setView('picker')} />;
}

// ─── Book picker ──────────────────────────────────────────────────────────────

function BookPicker({
  mapId,
  existingBookIds,
  existingNodeCount,
  onClose,
  onCreateNew,
}: Props & { onCreateNew: () => void }) {
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

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: '80vh' }}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-base font-semibold text-stone-900">Add book to map</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* "+ Add new book manually" row */}
        <div className="border-b border-stone-100 px-3 py-2">
          <button
            onClick={onCreateNew}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#3D6B8E] hover:bg-[#3D6B8E]/10 transition-colors"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Add new book manually
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
              className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-[#3D6B8E] focus:ring-2 focus:ring-[#3D6B8E]/10"
            />
          </div>
        </div>

        {/* Book list */}
        <div className="flex-1 overflow-y-auto py-2">
          {!filtered || filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-stone-400">
              <BookOpen className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">{query ? `No results for "${query}"` : 'No books in library yet'}</p>
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
                    alreadyAdded ? 'cursor-default opacity-40' : 'hover:bg-stone-50 active:bg-stone-100',
                  ].join(' ')}
                >
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: book.color ?? '#3D6B8E' }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900">{book.title}</p>
                    {book.author && <p className="truncate text-xs text-stone-500">{book.author}</p>}
                  </div>
                  {alreadyAdded
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    : <span className="shrink-0 text-xs font-medium text-[#3D6B8E]">{isAdding ? 'Adding…' : 'Add'}</span>}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// ─── Create book form (inline, no separate route) ─────────────────────────────

function CreateBookForm({
  mapId,
  existingNodeCount,
  existingBookIds,
  onClose,
  onBack,
}: Props & { onBack: () => void }) {
  const [title, setTitle]      = useState('');
  const [author, setAuthor]    = useState('');
  const [description, setDesc] = useState('');
  const [tags, setTags]        = useState('');
  const [color, setColor]      = useState(ACCENT_COLORS[0]);
  const [saving, setSaving]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const book = await createBook({
        title: title.trim(),
        author: author.trim() || undefined,
        description: description.trim() || undefined,
        color,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      // Add directly to the map
      await upsertCanvasNode({
        id: `${mapId}:${book.id}`,
        mapId,
        bookId: book.id,
        type: 'book',
        position: nextPosition(existingNodeCount + existingBookIds.size),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-stone-100 px-6 py-4">
          <button onClick={onBack} className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-stone-900">Add new book</h2>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          <Field label="Title *">
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT} placeholder="Book title" required />
          </Field>
          <Field label="Author">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className={INPUT} placeholder="Author name" />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDesc(e.target.value)} className={`${INPUT} resize-none`} rows={2} placeholder="What is this book about?" />
          </Field>
          <Field label="Tags">
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={INPUT} placeholder="philosophy, productivity" />
            <p className="mt-1 text-xs text-stone-400">Comma-separated</p>
          </Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={['h-7 w-7 rounded-full transition-transform hover:scale-110', color === c ? 'scale-110 ring-2 ring-stone-400 ring-offset-2' : ''].join(' ')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>
          <div className="flex gap-2 border-t border-stone-100 pt-2">
            <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
              Back
            </button>
            <button type="submit" disabled={!title.trim() || saving} className="flex-1 rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40">
              {saving ? 'Adding…' : 'Add to map'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</label>
      {children}
    </div>
  );
}
