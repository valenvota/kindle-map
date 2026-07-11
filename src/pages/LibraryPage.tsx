import { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Upload, BookOpen, Search, Plus, ChevronDown, X, User, SlidersHorizontal,
} from 'lucide-react';
import { db } from '../db/db';
import { AddBookModal } from '../components/book/AddBookModal';
import { BookCover } from '../components/book/BookCover';
import { SegmentedControl } from '../components/ui';
import { detectAttentionIssues } from '../utils/cleanBookMetadata';
import { getDisplayTitle, fullTitle } from '../utils/displayTitle';
import type { ReadingStatus } from '../types/book';

const STATUS_LABEL: Record<ReadingStatus, string> = {
  'want-to-read': 'Want to read',
  'reading':      'Reading',
  'finished':     'Finished',
};

const DOT_CLASS: Record<ReadingStatus, string> = {
  'want-to-read': 'want',
  'reading':      'reading',
  'finished':     'finished',
};

type ViewMode = 'covers' | 'cards';
type SortKey = 'title-asc' | 'title-desc' | 'highlights-desc' | 'highlights-asc' | 'recent';
type SourceFilter = 'all' | 'kindle' | 'manual';
type MapFilter = 'all' | 'in-map' | 'not-in-map';
type StatusFilter = 'all' | ReadingStatus;

type Props = {
  onImport: () => void;
  onOpenBook: (bookId: string) => void;
  initialTag?: string | null;
};

type BookInsight = { important: number; quote?: string; quoteImportant: boolean };

export function LibraryPage({ onImport, onOpenBook, initialTag }: Props) {
  const [showAddBook, setShowAddBook] = useState(false);
  const [view, setView]                     = useState<ViewMode>('covers');
  const [query, setQuery]                   = useState('');
  const [source, setSource]                 = useState<SourceFilter>('all');
  const [needsAttention, setNeedsAttention] = useState(false);
  const [noHighlights, setNoHighlights]     = useState(false);
  const [activeTags, setActiveTags]         = useState<string[]>(initialTag ? [initialTag] : []);
  const [author, setAuthor]                 = useState<string | null>(null);
  const [mapFilter, setMapFilter]           = useState<MapFilter>('all');
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('all');
  const [sortKey, setSortKey]               = useState<SortKey>('title-asc');
  const [filterOpen, setFilterOpen]         = useState(false);

  const books      = useLiveQuery(() => db.books.toArray(), []);
  const highlights = useLiveQuery(() => db.highlights.toArray(), []);

  const bookNodeIds = useLiveQuery(
    () => db.canvasNodes.where('type').equals('book').toArray(),
    [],
  );
  const bookIdsInMaps = useMemo(() => {
    const set = new Set<string>();
    bookNodeIds?.forEach((n) => { if (n.bookId) set.add(n.bookId); });
    return set;
  }, [bookNodeIds]);

  // Per-book insights: important count + a representative highlight (prefers an
  // important one). Also drives the "Important" figure in the stat rail.
  const insights = useMemo(() => {
    const m = new Map<string, BookInsight>();
    highlights?.forEach((h) => {
      let e = m.get(h.bookId);
      if (!e) { e = { important: 0, quote: undefined, quoteImportant: false }; m.set(h.bookId, e); }
      if (h.important) e.important += 1;
      const text = h.text?.trim();
      if (text && (h.type === 'highlight' || h.type === undefined)) {
        if (h.important && !e.quoteImportant) { e.quote = text; e.quoteImportant = true; }
        else if (!e.quote) { e.quote = text; }
      }
    });
    return m;
  }, [highlights]);

  const totals = useMemo(() => {
    const totalBooks = books?.length ?? 0;
    const totalHighlights = books?.reduce((s, b) => s + b.totalHighlights, 0) ?? 0;
    const totalImportant = highlights?.filter((h) => h.important).length ?? 0;
    return { totalBooks, totalHighlights, totalImportant };
  }, [books, highlights]);

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

  const toggleTag = (tag: string) =>
    setActiveTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));

  const filtered = useMemo(() => {
    let list = books ?? [];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((b) => b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q));
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
      case 'title-asc':       sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'title-desc':      sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'highlights-desc': sorted.sort((a, b) => b.totalHighlights - a.totalHighlights); break;
      case 'highlights-asc':  sorted.sort((a, b) => a.totalHighlights - b.totalHighlights); break;
      case 'recent':          sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
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

  const hasBooks = !!books && books.length > 0;

  return (
    <div className="lib-inner">

      {/* ── Empty library ─────────────────────────────────────────────────── */}
      {books && books.length === 0 && (
        <div className="lib-empty">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--accent-soft)' }}>
            <BookOpen className="h-8 w-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>Your library is empty</h2>
          <p className="mt-2 max-w-xs text-sm" style={{ color: 'var(--ink-soft)' }}>
            Import your Kindle highlights or add a book manually to begin.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onImport}
              className="km-btn km-btn--primary km-btn--md"
            >
              <Upload />
              Import My Clippings.txt
            </button>
            <button
              onClick={() => setShowAddBook(true)}
              className="km-btn km-btn--secondary km-btn--md"
            >
              <Plus />
              Add book manually
            </button>
          </div>
        </div>
      )}

      {hasBooks && (
        <>
          {/* ── Masthead ──────────────────────────────────────────────────── */}
          <header className="lib-masthead">
            <h1 className="lib-h1">Library</h1>
            <div className="lib-statrail">
              <div className="lib-stat"><b>{totals.totalBooks.toLocaleString()}</b><span>Books</span></div>
              <span className="lib-statsep" />
              <div className="lib-stat"><b>{totals.totalHighlights.toLocaleString()}</b><span>Highlights</span></div>
              <span className="lib-statsep" />
              <div className="lib-stat"><b>{totals.totalImportant.toLocaleString()}</b><span>Important</span></div>
            </div>
          </header>

          {/* ── Controls ──────────────────────────────────────────────────── */}
          <div className="lib-controls">
            <button className="lib-addbtn" onClick={() => setShowAddBook(true)}>
              <Plus />
              Add book
            </button>

            <div className="lib-controls__right">
              <SegmentedControl<ViewMode>
                aria-label="View mode"
                value={view}
                onChange={setView}
                options={[
                  { value: 'covers', label: 'Covers' },
                  { value: 'cards',  label: 'Cards' },
                ]}
              />

              <FilterPopover
                open={filterOpen}
                onOpenChange={setFilterOpen}
                activeCount={activeFilterCount}
                query={query} setQuery={setQuery}
                source={source} setSource={setSource}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                mapFilter={mapFilter} setMapFilter={setMapFilter}
                needsAttention={needsAttention} setNeedsAttention={setNeedsAttention}
                noHighlights={noHighlights} setNoHighlights={setNoHighlights}
                author={author} setAuthor={setAuthor} allAuthors={allAuthors}
                activeTags={activeTags} toggleTag={toggleTag} allTags={allTags}
                sortKey={sortKey} setSortKey={setSortKey}
                onClear={clearFilters}
              />
            </div>
          </div>

          {/* ── Covers ────────────────────────────────────────────────────── */}
          {view === 'covers' && filtered.length > 0 && (
            <section className="lib-shelf">
              {filtered.map((book) => (
                <button key={book.id} className="lib-book" onClick={() => onOpenBook(book.id)} title={fullTitle(book.title)}>
                  <BookCover book={book} />
                  <div className="lib-cap">
                    <span className="lib-cap__title">{getDisplayTitle(book.title)}</span>
                    {book.author && <span className="lib-cap__author">{book.author}</span>}
                    <span className="lib-cap__meta">
                      {book.readingStatus && <span className={`lib-dot lib-dot--${DOT_CLASS[book.readingStatus]}`} />}
                      {book.totalHighlights} highlight{book.totalHighlights !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))}
            </section>
          )}

          {/* ── Cards / reading index ─────────────────────────────────────── */}
          {view === 'cards' && filtered.length > 0 && (
            <section className="lib-list">
              {filtered.map((book) => {
                const info = insights.get(book.id);
                return (
                  <button key={book.id} className="lib-row" onClick={() => onOpenBook(book.id)} title={fullTitle(book.title)}>
                    <div className="lib-row__cover"><BookCover book={book} variant="row" /></div>
                    <div className="lib-row__main">
                      <div className="lib-row__head">
                        <span className="lib-row__title">{getDisplayTitle(book.title)}</span>
                        {book.author && <span className="lib-row__author">{book.author}</span>}
                      </div>
                      {info?.quote && (
                        <span className="lib-row__quote">
                          {info.quoteImportant && <span className="mark">★ </span>}
                          “{info.quote}”
                        </span>
                      )}
                    </div>
                    <div className="lib-row__meta">
                      {book.readingStatus && (
                        <span className="lib-row__status">
                          <span className={`lib-dot lib-dot--${DOT_CLASS[book.readingStatus]}`} />
                          {STATUS_LABEL[book.readingStatus]}
                        </span>
                      )}
                      <span className="lib-row__hl">
                        {book.totalHighlights} highlight{book.totalHighlights !== 1 ? 's' : ''}
                        {info && info.important > 0 && <> · <b>{info.important} important</b></>}
                      </span>
                    </div>
                  </button>
                );
              })}
            </section>
          )}

          {/* ── No results ────────────────────────────────────────────────── */}
          {filtered.length === 0 && (
            <div className="lib-empty">
              <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>No books match the current filters.</p>
              <button
                onClick={clearFilters}
                className="mt-3 text-sm font-medium underline"
                style={{ color: 'var(--accent)' }}
              >
                Clear filters
              </button>
            </div>
          )}
        </>
      )}

      {showAddBook && <AddBookModal onClose={() => setShowAddBook(false)} />}
    </div>
  );
}

// ─── FilterPopover ────────────────────────────────────────────────────────────

type FilterPopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  query: string; setQuery: (v: string) => void;
  source: SourceFilter; setSource: (v: SourceFilter) => void;
  statusFilter: StatusFilter; setStatusFilter: (v: StatusFilter) => void;
  mapFilter: MapFilter; setMapFilter: (v: MapFilter) => void;
  needsAttention: boolean; setNeedsAttention: (v: boolean) => void;
  noHighlights: boolean; setNoHighlights: (v: boolean) => void;
  author: string | null; setAuthor: (v: string | null) => void; allAuthors: string[];
  activeTags: string[]; toggleTag: (t: string) => void; allTags: string[];
  sortKey: SortKey; setSortKey: (v: SortKey) => void;
  onClear: () => void;
};

function FilterPopover(props: FilterPopoverProps) {
  const { open, onOpenChange, activeCount } = props;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [open, onOpenChange]);

  return (
    <div className="lib-filter" ref={ref}>
      <button className="lib-filterbtn" onClick={() => onOpenChange(!open)}>
        <SlidersHorizontal />
        Filter
        {activeCount > 0 && <span className="lib-filterbtn__badge">{activeCount}</span>}
      </button>

      {open && (
        <div className="lib-pop">
          <div className="lib-pop__group">
            <div className="lib-pop__label">Search</div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
              <input
                className="lib-popsearch"
                style={{ paddingLeft: 32 }}
                placeholder="Title or author…"
                value={props.query}
                onChange={(e) => props.setQuery(e.target.value)}
              />
              {props.query && (
                <button
                  onClick={() => props.setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <OptGroup label="Reading status">
            <Opt on={props.statusFilter === 'all'} onClick={() => props.setStatusFilter('all')}>Any</Opt>
            {(['want-to-read', 'reading', 'finished'] as ReadingStatus[]).map((s) => (
              <Opt key={s} on={props.statusFilter === s} onClick={() => props.setStatusFilter(s)}>{STATUS_LABEL[s]}</Opt>
            ))}
          </OptGroup>

          <OptGroup label="Source">
            {(['all', 'kindle', 'manual'] as SourceFilter[]).map((s) => (
              <Opt key={s} on={props.source === s} onClick={() => props.setSource(s)}>
                {s === 'all' ? 'Any' : s === 'kindle' ? 'Kindle' : 'Manual'}
              </Opt>
            ))}
          </OptGroup>

          <OptGroup label="Maps">
            {(['all', 'in-map', 'not-in-map'] as MapFilter[]).map((m) => (
              <Opt key={m} on={props.mapFilter === m} onClick={() => props.setMapFilter(m)}>
                {m === 'all' ? 'Any' : m === 'in-map' ? 'In a map' : 'Not in a map'}
              </Opt>
            ))}
          </OptGroup>

          <OptGroup label="Flags">
            <Opt on={props.needsAttention} onClick={() => props.setNeedsAttention(!props.needsAttention)}>Needs attention</Opt>
            <Opt on={props.noHighlights} onClick={() => props.setNoHighlights(!props.noHighlights)}>No highlights</Opt>
          </OptGroup>

          {props.allAuthors.length > 0 && (
            <AuthorDropdown authors={props.allAuthors} value={props.author} onChange={props.setAuthor} />
          )}

          {props.allTags.length > 0 && (
            <OptGroup label="Tags">
              {props.allTags.map((tag) => (
                <Opt key={tag} on={props.activeTags.includes(tag)} onClick={() => props.toggleTag(tag)}>#{tag}</Opt>
              ))}
            </OptGroup>
          )}

          <div className="lib-pop__group">
            <div className="lib-pop__label">Sort by</div>
            <select
              className="lib-popsort"
              value={props.sortKey}
              onChange={(e) => props.setSortKey(e.target.value as SortKey)}
            >
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
              <option value="highlights-desc">Most highlights</option>
              <option value="highlights-asc">Fewest highlights</option>
              <option value="recent">Recently added</option>
            </select>
          </div>

          <div className="lib-pop__foot">
            <button className="lib-clear" onClick={props.onClear} disabled={activeCount === 0} style={{ opacity: activeCount === 0 ? 0.4 : 1 }}>
              Clear all
            </button>
            <button className="km-btn km-btn--secondary km-btn--sm" onClick={() => onOpenChange(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

function OptGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="lib-pop__group">
      <div className="lib-pop__label">{label}</div>
      <div className="lib-optrow">{children}</div>
    </div>
  );
}

function Opt({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={`lib-opt${on ? ' on' : ''}`} onClick={onClick}>{children}</button>
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
    <div className="lib-pop__group" ref={ref}>
      <div className="lib-pop__label">Author</div>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`lib-opt${value ? ' on' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <User className="h-3 w-3" />
          {value ?? 'Any author'}
          <ChevronDown className="h-3 w-3" />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-lg border p-2 shadow-lg" style={{ borderColor: 'var(--hair-md)', background: 'var(--surface)' }}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search authors…"
              className="mb-1 w-full rounded-md border px-2 py-1 text-xs outline-none"
              style={{ borderColor: 'var(--hair-md)', background: 'var(--paper)', color: 'var(--ink)' }}
            />
            <div className="max-h-44 overflow-y-auto">
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
                  className="block w-full truncate rounded-md px-2 py-1.5 text-left text-xs"
                  style={value === a ? { background: 'var(--accent-soft)', color: 'var(--accent-deep)' } : { color: 'var(--ink-soft)' }}
                >
                  {a}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-2 py-1.5 text-xs" style={{ color: 'var(--ink-faint)' }}>No authors found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
