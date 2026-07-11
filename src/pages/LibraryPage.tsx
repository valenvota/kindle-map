import { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Upload, BookOpen, Search, AlertCircle,
  Plus, ChevronDown, X, User,
} from 'lucide-react';
import { db } from '../db/db';
import { AddBookModal } from '../components/book/AddBookModal';
import { detectAttentionIssues } from '../utils/cleanBookMetadata';
import type { Book, ReadingStatus } from '../types/book';

const STATUS_CONFIG: Record<ReadingStatus, { label: string; emoji: string }> = {
  'want-to-read': { label: 'Want to read', emoji: '📚' },
  'reading':      { label: 'Reading',      emoji: '📖' },
  'finished':     { label: 'Finished',     emoji: '✅' },
};

type SortKey = 'title-asc' | 'title-desc' | 'highlights-desc' | 'highlights-asc' | 'recent';
type SourceFilter = 'all' | 'kindle' | 'manual';
type MapFilter = 'all' | 'in-map' | 'not-in-map';
type StatusFilter = 'all' | ReadingStatus;

type Props = {
  onImport: () => void;
  onOpenBook: (bookId: string) => void;
  onOpenSearch?: () => void;
  initialTag?: string | null;
};

export function LibraryPage({ onImport, onOpenBook, onOpenSearch, initialTag }: Props) {
  const [showAddBook, setShowAddBook] = useState(false);
  const [query, setQuery] = useState('');
  const [source, setSource]               = useState<SourceFilter>('all');
  const [needsAttention, setNeedsAttention] = useState(false);
  const [noHighlights, setNoHighlights]   = useState(false);
  const [activeTags, setActiveTags]       = useState<string[]>(initialTag ? [initialTag] : []);
  const [author, setAuthor]               = useState<string | null>(null);
  const [mapFilter, setMapFilter]         = useState<MapFilter>('all');
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>('all');
  const [sortKey, setSortKey]             = useState<SortKey>('title-asc');

  const books = useLiveQuery(() => db.books.toArray(), []);

  const bookNodeIds = useLiveQuery(
    () => db.canvasNodes.where('type').equals('book').toArray(),
    [],
  );
  const bookIdsInMaps = useMemo(() => {
    const set = new Set<string>();
    bookNodeIds?.forEach((n) => { if (n.bookId) set.add(n.bookId); });
    return set;
  }, [bookNodeIds]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    books?.forEach((b) => (b.tags ?? []).filter(Boolean).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [books]);

  const allAuthors = useMemo(() => {
    const set = new Set<string>();
    books?.forEach((b) => { if (b.author) set.add(b.author); });
    return Array.from(set).sort();
  }, [books]);

  const toggleTag = (tag: string) => {
    setActiveTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
  };

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
    if (statusFilter !== 'all')     list = list.filter((b) => b.readingStatus === statusFilter);

    const sorted = [...list];
    switch (sortKey) {
      case 'title-asc':         sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'title-desc':        sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'highlights-desc':   sorted.sort((a, b) => b.totalHighlights - a.totalHighlights); break;
      case 'highlights-asc':    sorted.sort((a, b) => a.totalHighlights - b.totalHighlights); break;
      case 'recent':            sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    }
    return sorted;
  }, [books, query, source, needsAttention, noHighlights, activeTags, author, mapFilter, statusFilter, bookIdsInMaps, sortKey]);

  const activeFilterCount = [
    source !== 'all', needsAttention, noHighlights, activeTags.length > 0,
    author !== null, mapFilter !== 'all', statusFilter !== 'all', query !== '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSource('all');
    setNeedsAttention(false);
    setNoHighlights(false);
    setActiveTags([]);
    setAuthor(null);
    setMapFilter('all');
    setStatusFilter('all');
    setSortKey('title-asc');
    setQuery('');
  };

  const hasBooks = books && books.length > 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-sm" style={{ borderColor: 'var(--border-md)' }}>
        <div className="mx-auto flex max-w-5xl items-center justify-end px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
              <input
                type="text"
                placeholder="Search books…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-52 rounded-lg border py-1.5 pl-9 pr-4 text-sm outline-none transition-colors"
                style={{ borderColor: 'var(--border-md)', color: 'var(--text)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(61,107,142,0.10)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-md)'; e.target.style.boxShadow = 'none'; }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-3)' }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="flex items-center justify-center rounded-lg border p-2 sm:hidden"
                style={{ borderColor: 'var(--border-md)', color: 'var(--text-2)' }}
                title="Search (⌘K)"
              >
                <Search className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => setShowAddBook(true)}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-stone-50"
              style={{ borderColor: 'var(--border-md)', color: 'var(--text-2)' }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add book</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      {hasBooks && (
        <div className="border-b bg-white" style={{ borderColor: 'var(--border)' }}>
          <div className="mx-auto max-w-5xl px-6 py-3">

            <div className="flex flex-wrap items-center gap-2">

              {/* Source chips */}
              <div className="flex rounded-lg border p-0.5 text-xs" style={{ borderColor: 'var(--border-md)', background: 'var(--surface-2)' }}>
                {(['all', 'kindle', 'manual'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSource(s)}
                    className="rounded-md px-3 py-1.5 font-medium capitalize transition-colors"
                    style={source === s
                      ? { background: 'white', color: 'var(--text)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                      : { color: 'var(--text-3)' }}
                  >
                    {s === 'all' ? 'All' : s === 'kindle' ? 'Kindle' : 'Manual'}
                  </button>
                ))}
              </div>

              {/* Needs attention */}
              <ToggleChip
                active={needsAttention}
                onClick={() => setNeedsAttention((v) => !v)}
                label="Needs attention"
                icon={<AlertCircle className="h-3 w-3" />}
                activeStyle={{ borderColor: '#f97316', background: '#fff7ed', color: '#c2410c' }}
              />

              {/* No highlights */}
              <ToggleChip
                active={noHighlights}
                onClick={() => setNoHighlights((v) => !v)}
                label="No highlights"
              />

              {/* Map filter */}
              <div className="flex rounded-lg border p-0.5 text-xs" style={{ borderColor: 'var(--border-md)', background: 'var(--surface-2)' }}>
                {(['all', 'in-map', 'not-in-map'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMapFilter(m)}
                    className="rounded-md px-3 py-1.5 font-medium transition-colors"
                    style={mapFilter === m
                      ? { background: 'white', color: 'var(--text)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                      : { color: 'var(--text-3)' }}
                  >
                    {m === 'all' ? 'Any map' : m === 'in-map' ? 'In a map' : 'Not in a map'}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div className="flex rounded-lg border p-0.5 text-xs" style={{ borderColor: 'var(--border-md)', background: 'var(--surface-2)' }}>
                {(['all', 'want-to-read', 'reading', 'finished'] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="rounded-md px-3 py-1.5 font-medium transition-colors"
                    style={statusFilter === s
                      ? { background: 'white', color: 'var(--text)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                      : { color: 'var(--text-3)' }}
                  >
                    {s === 'all' ? 'Any status' : `${STATUS_CONFIG[s].emoji} ${STATUS_CONFIG[s].label}`}
                  </button>
                ))}
              </div>

              {allAuthors.length > 0 && (
                <AuthorDropdown authors={allAuthors} value={author} onChange={setAuthor} />
              )}

              <div className="flex-1" />

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium underline transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
                >
                  Clear filters
                </button>
              )}

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="appearance-none cursor-pointer rounded-lg border bg-white py-1.5 pl-3 pr-7 text-xs font-medium outline-none"
                  style={{ borderColor: 'var(--border-md)', color: 'var(--text-2)' }}
                >
                  <option value="title-asc">Title A–Z</option>
                  <option value="title-desc">Title Z–A</option>
                  <option value="highlights-desc">Most highlights</option>
                  <option value="highlights-asc">Fewest highlights</option>
                  <option value="recent">Recently added</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
              </div>
            </div>

            {/* Tag chips */}
            {allTags.length > 0 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
                    style={activeTags.includes(tag)
                      ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' }
                      : { borderColor: 'var(--border-md)', background: 'white', color: 'var(--text-3)' }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-6 py-8">

        {hasBooks && (
          <div className="mb-6 flex items-baseline gap-2">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Your Library</h1>
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>
              {filtered.length === books.length
                ? `${books.length} book${books.length !== 1 ? 's' : ''}`
                : `${filtered.length} of ${books.length} books`}
            </span>
          </div>
        )}

        {/* Empty library */}
        {books && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--brand-soft)' }}>
              <BookOpen className="h-8 w-8" style={{ color: 'var(--brand)' }} />
            </div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>No books yet</h2>
            <p className="mt-2 max-w-xs text-sm" style={{ color: 'var(--text-2)' }}>
              Import your Kindle highlights or add a book manually.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onImport}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
                style={{ background: 'var(--brand)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-mid)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brand)')}
              >
                <Upload className="h-4 w-4" />
                Import My Clippings.txt
              </button>
              <button
                onClick={() => setShowAddBook(true)}
                className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-stone-50"
                style={{ borderColor: 'var(--border-md)', color: 'var(--text-2)' }}
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
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>No books match the current filters.</p>
            <button
              onClick={clearFilters}
              className="mt-3 text-sm font-medium underline"
              style={{ color: 'var(--accent)' }}
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

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
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        style={value
          ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' }
          : { borderColor: 'var(--border-md)', background: 'white', color: 'var(--text-3)' }}
      >
        <User className="h-3 w-3" />
        {value ?? 'Author'}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border bg-white p-2 shadow-lg" style={{ borderColor: 'var(--border-md)' }}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search authors…"
            className="mb-1 w-full rounded-md border px-2 py-1 text-xs outline-none"
            style={{ borderColor: 'var(--border-md)' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-md)'; }}
          />
          <div className="max-h-48 overflow-y-auto">
            {value && (
              <button
                onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium"
                style={{ color: 'var(--accent)' }}
              >
                Clear author filter
              </button>
            )}
            {filtered.map((a) => (
              <button
                key={a}
                onClick={() => { onChange(a); setOpen(false); setSearch(''); }}
                className="block w-full truncate rounded-md px-2 py-1.5 text-left text-xs hover:bg-stone-50"
                style={value === a ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : { color: 'var(--text-2)' }}
              >
                {a}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-2 py-1.5 text-xs" style={{ color: 'var(--text-3)' }}>No authors found</p>
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
  activeStyle,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  activeStyle?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
      style={active
        ? (activeStyle ?? { borderColor: 'var(--brand)', background: 'var(--brand)', color: 'white' })
        : { borderColor: 'var(--border-md)', background: 'white', color: 'var(--text-3)' }}
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
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all hover:shadow-md"
      style={needsAttention
        ? { borderColor: '#fed7aa' }
        : { borderColor: 'var(--border-md)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = needsAttention ? '#fdba74' : 'var(--accent-border)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = needsAttention ? '#fed7aa' : 'var(--border-md)'; }}
    >
      {book.coverImage ? (
        <div className="mb-3 -mx-5 -mt-5 flex items-start justify-between">
          <img
            src={book.coverImage}
            alt=""
            className="h-28 w-full rounded-t-2xl object-cover"
          />
          {needsAttention && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-500 shadow-sm">
              <AlertCircle className="h-3 w-3" />
              Fix
            </span>
          )}
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <div
            className="h-1.5 w-10 rounded-full"
            style={{ backgroundColor: book.color ?? 'var(--accent)' }}
          />
          {needsAttention && (
            <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-500">
              <AlertCircle className="h-3 w-3" />
              Fix
            </span>
          )}
        </div>
      )}

      <div className="flex-1">
        <h3
          className="line-clamp-2 font-semibold leading-snug transition-colors"
          style={{ color: 'var(--text)' }}
        >
          {book.title}
        </h3>
        {book.author ? (
          <p className="mt-1 line-clamp-1 text-sm" style={{ color: 'var(--text-2)' }}>{book.author}</p>
        ) : (
          <p className="mt-1 text-sm italic" style={{ color: 'var(--text-3)' }}>No author</p>
        )}

        {visibleTags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
              >
                #{tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>+{extraTags}</span>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
        >
          {book.totalHighlights} highlights
        </span>
        <div className="flex items-center gap-1.5">
          {book.readingStatus && (
            <span className="text-xs">
              {STATUS_CONFIG[book.readingStatus].emoji}
            </span>
          )}
          <span className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{book.source}</span>
        </div>
      </div>
    </button>
  );
}
