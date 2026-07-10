import { useEffect, useMemo, useState } from 'react';
import { Search, BookOpen, Quote, StickyNote, Lightbulb, Map as MapIcon, Tag as TagIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Highlight } from '../../types/highlight';

type ResultType = 'book' | 'highlight' | 'map' | 'topic' | 'note' | 'quote' | 'tag';

type SearchResult = {
  type: ResultType;
  key: string;
  title: string;
  subtitle?: string;
  bookId?: string;
  highlightId?: string;
  mapId?: string;
  tag?: string;
};

const GROUP_LABELS: Record<ResultType, string> = {
  book: 'Books',
  highlight: 'Highlights',
  map: 'Maps',
  topic: 'Topics',
  note: 'Notes',
  quote: 'Quotes',
  tag: 'Tags',
};

const GROUP_ICONS: Record<ResultType, React.ReactNode> = {
  book: <BookOpen className="h-4 w-4" />,
  highlight: <Quote className="h-4 w-4" />,
  map: <MapIcon className="h-4 w-4" />,
  topic: <Lightbulb className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
  quote: <Quote className="h-4 w-4" />,
  tag: <TagIcon className="h-4 w-4" />,
};

const GROUP_ORDER: ResultType[] = ['book', 'highlight', 'map', 'topic', 'note', 'quote', 'tag'];
const MAX_PER_GROUP = 5;
const MAX_HIGHLIGHT_RESULTS = 30;

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenBook: (bookId: string, highlightId?: string) => void;
  onOpenMap: (mapId: string) => void;
  onOpenTag: (tag: string) => void;
};

export function CommandPalette({ open, onClose, onOpenBook, onOpenMap, onOpenTag }: Props) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [highlightMatches, setHighlightMatches] = useState<Highlight[]>([]);

  const books = useLiveQuery(() => db.books.toArray(), []);
  const maps = useLiveQuery(() => db.maps.toArray(), []);
  const canvasNodes = useLiveQuery(() => db.canvasNodes.toArray(), []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    books?.forEach((b) => (b.tags ?? []).filter(Boolean).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [books]);

  // Reset state whenever the palette opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setHighlightMatches([]);
    }
  }, [open]);

  // Debounced highlight search (queried on demand, capped, lower-cased substring match)
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      setHighlightMatches([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const matches = await db.highlights
        .filter((h) => h.text.toLowerCase().includes(q))
        .limit(MAX_HIGHLIGHT_RESULTS)
        .toArray();
      if (!cancelled) setHighlightMatches(matches);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const bookMap = useMemo(() => new Map((books ?? []).map((b) => [b.id, b])), [books]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result: Record<ResultType, SearchResult[]> = {
      book: [], highlight: [], map: [], topic: [], note: [], quote: [], tag: [],
    };

    if (q.length === 0) return result;

    (books ?? []).forEach((b) => {
      if (b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q)) {
        result.book.push({
          type: 'book',
          key: `book-${b.id}`,
          title: b.title,
          subtitle: b.author,
          bookId: b.id,
        });
      }
    });

    (maps ?? []).forEach((m) => {
      if (m.name.toLowerCase().includes(q)) {
        result.map.push({ type: 'map', key: `map-${m.id}`, title: m.name, mapId: m.id });
      }
    });

    (canvasNodes ?? []).forEach((n) => {
      if (n.type === 'topic' || n.type === 'note') {
        const content = n.content ?? '';
        if (content.toLowerCase().includes(q)) {
          result[n.type].push({
            type: n.type,
            key: `node-${n.id}`,
            title: content || '(empty)',
            mapId: n.mapId,
          });
        }
      } else if (n.type === 'quote') {
        const content = n.content ?? '';
        const book = bookMap.get(n.bookId ?? '');
        if (content.toLowerCase().includes(q) || book?.title.toLowerCase().includes(q)) {
          result.quote.push({
            type: 'quote',
            key: `node-${n.id}`,
            title: content || '(empty)',
            subtitle: book ? `from ${book.title}` : undefined,
            mapId: n.mapId,
          });
        }
      }
    });

    allTags.forEach((tag) => {
      if (tag.toLowerCase().includes(q)) {
        result.tag.push({ type: 'tag', key: `tag-${tag}`, title: `#${tag}`, tag });
      }
    });

    highlightMatches.forEach((h) => {
      const book = bookMap.get(h.bookId);
      result.highlight.push({
        type: 'highlight',
        key: `highlight-${h.id}`,
        title: h.text.length > 140 ? `${h.text.slice(0, 140)}…` : h.text,
        subtitle: book?.title,
        bookId: h.bookId,
        highlightId: h.id,
      });
    });

    return result;
  }, [query, books, maps, canvasNodes, allTags, highlightMatches, bookMap]);

  // Flatten visible results (capped per group) for keyboard navigation
  const flatResults = useMemo(() => {
    const flat: SearchResult[] = [];
    GROUP_ORDER.forEach((type) => {
      flat.push(...groups[type].slice(0, MAX_PER_GROUP));
    });
    return flat;
  }, [groups]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const select = (r: SearchResult) => {
    switch (r.type) {
      case 'book':
        onOpenBook(r.bookId!);
        break;
      case 'highlight':
        onOpenBook(r.bookId!, r.highlightId);
        break;
      case 'map':
      case 'topic':
      case 'note':
      case 'quote':
        onOpenMap(r.mapId!);
        break;
      case 'tag':
        onOpenTag(r.tag!);
        break;
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = flatResults[activeIndex];
      if (r) select(r);
    }
  };

  if (!open) return null;

  const hasQuery = query.trim().length > 0;
  const hasResults = flatResults.length > 0;
  let runningIndex = -1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        className="fixed left-1/2 top-[12vh] z-[60] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-stone-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search books, highlights, maps, tags…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
          <kbd className="hidden shrink-0 rounded border border-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-400 sm:inline-block">
            Esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!hasQuery && (
            <div className="px-4 py-10 text-center text-sm text-stone-400">
              Start typing to search your library, highlights, maps, and tags.
            </div>
          )}

          {hasQuery && !hasResults && (
            <div className="px-4 py-10 text-center text-sm text-stone-400">
              No results for "{query}"
            </div>
          )}

          {hasQuery && GROUP_ORDER.map((type) => {
            const items = groups[type].slice(0, MAX_PER_GROUP);
            if (items.length === 0) return null;
            return (
              <div key={type} className="mb-1">
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  {GROUP_LABELS[type]}
                </p>
                {items.map((r) => {
                  runningIndex += 1;
                  const idx = runningIndex;
                  return (
                    <button
                      key={r.key}
                      onClick={() => select(r)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={[
                        'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                        idx === activeIndex ? 'bg-[#3D6B8E]/10' : 'hover:bg-stone-50',
                      ].join(' ')}
                    >
                      <span className="mt-0.5 shrink-0 text-stone-400">{GROUP_ICONS[r.type]}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-stone-800">{r.title}</span>
                        {r.subtitle && (
                          <span className="block truncate text-xs text-stone-400">{r.subtitle}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
