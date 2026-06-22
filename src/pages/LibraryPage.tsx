import { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Upload, BookOpen, Search, Map, AlertCircle,
  Plus, ChevronDown, X, User,
} from 'lucide-react';
import { db } from '../db/db';
import { AddBookModal } from '../components/book/AddBookModal';
import { detectAttentionIssues } from '../utils/cleanBookMetadata';
import type { Book } from '../types/book';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'title-asc' | 'title-desc' | 'highlights-desc' | 'highlights-asc' | 'recent';
type SourceFilter = 'all' | 'kindle' | 'manual';
type MapFilter = 'all' | 'in-map' | 'not-in-map';

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = {
  onImport: () => void;
  onMapsView?: () => void;
  onOpenBook: (bookId: string) => void;
  onOpenSearch?: () => void;
  initialTag?: string | null;
};

export function LibraryPage({ onImport, onMapsView, onOpenBook, onOpenSearch, initialTag }: Props) {
  const [showAddBook, setShowAddBook]   = useState(false);

  // Search
  const [query, setQuery] = useState('');

  // Filters
  const [source, setSource]               = useState<SourceFilter>('all');
  const [needsAttention, setNeedsAttention] = useState(false);
  const [noHighlights, setNoHighlights]   = useState(false);
  const [activeTags, setActiveTags]       = useState<string[]>(initialTag ? [initialTag] : []);
  const [author, setAuthor]               = useState<string | null>(null);
  const [mapFilter, setMapFilter]         = useState<MapFilter>('all');
  const [sortKey, setSortKey]             = useState<SortKey>('title-asc');

  const books = useLiveQuery(() => db.books.toArray(), []);

  // Book ids referenced by at least one book-node across all maps
  const bookNodeIds = useLiveQuery(
    () => db.canvasNodes.where('type').equals('book').toArray(),
    [],
  );
  const bookIdsInMaps = useMemo(() => {
    const set = new Set<string>();
    bookNodeIds?.forEach((n) => { if (n.bookId) set.add(n.bookId); });
    return set;
  }, [bookNodeIds]);

  // All unique tags across the library
  const allTags = useMemo(() => {
    const set = new Set<string>();
    books?.forEach((b) => (b.tags ?? []).filter(Boolean).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [books]);

  // All unique authors across the library
  const allAuthors = useMemo(() => {
    const set = new Set<string>();
    books?.forEach((b) => { if (b.author) set.add(b.author); });
    return Array.from(set).sort();
  }, [books]);

  const toggleTag = (tag: string) => {
    setActiveTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
  };

  // Filter + sort in one pass
  const filtered = useMemo(() => {
    let list = books ?? [];

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q),
      );
    }
    if (source !== 'all')    list = list.filter((b) => b.source === source);
    if (needsAttention)      list = list.filter((b) => detectAttentionIssues(b.title, b.author).length > 0);
    if (noHighlights)        list = list.filter((b) => b.totalHighlights === 0);
    if (activeTags.length)   list = list.filter((b) => activeTags.every((t) => (b.tags ?? []).includes(t)));
    if (author)              list = list.filter((b) => b.author === author);
    if (mapFilter === 'in-map')     list = list.filter((b) => bookIdsInMaps.has(b.id));
    if (mapFilter === 'not-in-map') list = list.filter((b) => !bookIdsInMaps.has(b.id));

    const sorted = [...list];
    switch (sortKey) {
      case 'title-asc':         sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'title-desc':        sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'highlights-desc':   sorted.sort((a, b) => b.totalHighlights - a.totalHighlights); break;
      case 'highlights-asc':    sorted.sort((a, b) => a.totalHighlights - b.totalHighlights); break;
      case 'recent':            sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    }
    return sorted;
  }, [books, query, source, needsAttention, noHighlights, activeTags, author, mapFilter, bookIdsInMaps, sortKey]);

  const activeFilterCount = [
    source !== 'all', needsAttention, noHighlights, activeTags.length > 0,
    author !== null, mapFilter !== 'all', query !== '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSource('all');
    setNeedsAttention(false);
    setNoHighlights(false);
    setActiveTags([]);
    setAuthor(null);
    setMapFilter('all');
    setSortKey('title-asc');
    setQuery('');
  };

  const hasBooks = books && books.length > 0;

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
              <span className="text-sm font-bold text-white">K</span>
            </div>
            <span className="font-semibold text-stone-900">KindleMap</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search — visible on sm+ */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search books…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-52 rounded-lg border border-stone-200 py-1.5 pl-9 pr-4 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Mobile search → opens global Cmd+K palette */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="flex items-center justify-center rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-stone-50 sm:hidden"
                title="Search (⌘K)"
              >
                <Search className="h-4 w-4" />
              </button>
            )}

            {onMapsView && (
              <button
                onClick={onMapsView}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Maps</span>
              </button>
            )}

            <button
              onClick={() => setShowAddBook(true)}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add book</span>
            </button>

            <button
              onClick={onImport}
              className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Filter bar (only when library has books) ─────────────────────── */}
      {hasBooks && (
        <div className="border-b border-stone-100 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-3">

            {/* Row 1: main controls */}
            <div className="flex flex-wrap items-center gap-2">

              {/* Source chips */}
              <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs">
                {(['all', 'kindle', 'manual'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSource(s)}
                    className={[
                      'rounded-md px-3 py-1.5 font-medium capitalize transition-colors',
                      source === s
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-800',
                    ].join(' ')}
                  >
                    {s === 'all' ? 'All' : s === 'kindle' ? 'Kindle' : 'Manual'}
                  </button>
                ))}
              </div>

              {/* Toggle: Needs attention */}
              <ToggleChip
                active={needsAttention}
                onClick={() => setNeedsAttention((v) => !v)}
                label="Needs attention"
                icon={<AlertCircle className="h-3 w-3" />}
                activeClass="border-orange-400 bg-orange-50 text-orange-700"
              />

              {/* Toggle: No highlights */}
              <ToggleChip
                active={noHighlights}
                onClick={() => setNoHighlights((v) => !v)}
                label="No highlights"
              />

              {/* Map inclusion chips */}
              <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs">
                {(['all', 'in-map', 'not-in-map'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMapFilter(m)}
                    className={[
                      'rounded-md px-3 py-1.5 font-medium transition-colors',
                      mapFilter === m
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-800',
                    ].join(' ')}
                  >
                    {m === 'all' ? 'Any map' : m === 'in-map' ? 'In a map' : 'Not in a map'}
                  </button>
                ))}
              </div>

              {/* Author dropdown */}
              {allAuthors.length > 0 && (
                <AuthorDropdown authors={allAuthors} value={author} onChange={setAuthor} />
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Clear filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-stone-400 hover:text-stone-700 underline"
                >
                  Clear filters
                </button>
              )}

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="appearance-none cursor-pointer rounded-lg border border-stone-200 bg-white py-1.5 pl-3 pr-7 text-xs font-medium text-stone-600 outline-none focus:border-amber-400"
                >
                  <option value="title-asc">Title A–Z</option>
                  <option value="title-desc">Title Z–A</option>
                  <option value="highlights-desc">Most highlights</option>
                  <option value="highlights-asc">Fewest highlights</option>
                  <option value="recent">Recently added</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400" />
              </div>
            </div>

            {/* Row 2: tag chips (only when tags exist) */}
            {allTags.length > 0 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={[
                      'shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                      activeTags.includes(tag)
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-700',
                    ].join(' ')}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-6 py-8">

        {/* Stats row */}
        {hasBooks && (
          <div className="mb-6 flex items-baseline gap-2">
            <h1 className="text-2xl font-semibold text-stone-900">Your Library</h1>
            <span className="text-sm text-stone-400">
              {filtered.length === books.length
                ? `${books.length} book${books.length !== 1 ? 's' : ''}`
                : `${filtered.length} of ${books.length} books`}
            </span>
          </div>
        )}

        {/* Empty library */}
        {books && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
              <BookOpen className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-stone-800">No books yet</h2>
            <p className="mt-2 max-w-xs text-sm text-stone-500">
              Import your Kindle highlights or add a book manually.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onImport}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600"
              >
                <Upload className="h-4 w-4" />
                Import My Clippings.txt
              </button>
              <button
                onClick={() => setShowAddBook(true)}
                className="flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                <Plus className="h-4 w-4" />
                Add book manually
              </button>
            </div>
          </div>
        )}

        {/* Book grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => onOpenBook(book.id)} />
            ))}
          </div>
        )}

        {/* No results */}
        {hasBooks && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-stone-400">No books match the current filters.</p>
            <button
              onClick={clearFilters}
              className="mt-3 text-sm font-medium text-amber-600 hover:text-amber-800 underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      {/* Add book modal */}
      {showAddBook && <AddBookModal onClose={() => setShowAddBook(false)} />}
    </div>
  );
}

// ─── AuthorDropdown ───────────────────────────────────────────────────────────

function AuthorDropdown({
  authors,
  value,
  onChange,
}: {
  authors: string[];
  value: string | null;
  onChange: (author: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = authors.filter((a) => a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
          value
            ? 'border-amber-500 bg-amber-50 text-amber-700'
            : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-700',
        ].join(' ')}
      >
        <User className="h-3 w-3" />
        {value ?? 'Author'}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search authors…"
            className="mb-1 w-full rounded-md border border-stone-200 px-2 py-1 text-xs outline-none focus:border-amber-400"
          />
          <div className="max-h-48 overflow-y-auto">
            {value && (
              <button
                onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-amber-600 hover:bg-stone-50"
              >
                Clear author filter
              </button>
            )}
            {filtered.map((a) => (
              <button
                key={a}
                onClick={() => { onChange(a); setOpen(false); setSearch(''); }}
                className={[
                  'block w-full truncate rounded-md px-2 py-1.5 text-left text-xs',
                  value === a ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-50',
                ].join(' ')}
              >
                {a}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-2 py-1.5 text-xs text-stone-400">No authors found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ToggleChip ───────────────────────────────────────────────────────────────

function ToggleChip({
  active,
  onClick,
  label,
  icon,
  activeClass = 'border-stone-900 bg-stone-900 text-white',
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? activeClass
          : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-700',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── BookCard ─────────────────────────────────────────────────────────────────

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  const issues = detectAttentionIssues(book.title, book.author);
  const needsAttention = issues.length > 0;
  const tags = (book.tags ?? []).filter(Boolean);
  const visibleTags = tags.slice(0, 2);
  const extraTags = tags.length - visibleTags.length;

  return (
    <button
      onClick={onClick}
      className={[
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all hover:shadow-md',
        needsAttention
          ? 'border-orange-200 hover:border-orange-300'
          : 'border-stone-200 hover:border-stone-300',
      ].join(' ')}
    >
      {/* Cover image, or color accent + attention indicator */}
      {book.coverImage ? (
        <div className="mb-3 -mx-5 -mt-5 flex items-start justify-between">
          <img
            src={book.coverImage}
            alt=""
            className="h-28 w-full rounded-t-2xl object-cover"
          />
          {needsAttention && (
            <span
              title={issues.map((i) => i.replace(/-/g, ' ')).join(', ')}
              className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-500 shadow-sm"
            >
              <AlertCircle className="h-3 w-3" />
              Fix
            </span>
          )}
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <div
            className="h-1.5 w-10 rounded-full"
            style={{ backgroundColor: book.color ?? '#f59e0b' }}
          />
          {needsAttention && (
            <span
              title={issues.map((i) => i.replace(/-/g, ' ')).join(', ')}
              className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-500"
            >
              <AlertCircle className="h-3 w-3" />
              Fix
            </span>
          )}
        </div>
      )}

      <div className="flex-1">
        <h3 className="line-clamp-2 font-semibold leading-snug text-stone-900 transition-colors group-hover:text-amber-700">
          {book.title}
        </h3>
        {book.author ? (
          <p className="mt-1 line-clamp-1 text-sm text-stone-500">{book.author}</p>
        ) : (
          <p className="mt-1 text-sm italic text-stone-400">No author</p>
        )}

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
              >
                #{tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="text-xs text-stone-400">+{extraTags}</span>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
          {book.totalHighlights} highlights
        </span>
        <span className="text-xs capitalize text-stone-400">{book.source}</span>
      </div>
    </button>
  );
}
