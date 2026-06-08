import { useEffect, useState, useMemo } from 'react';
import { X, Search, Download, BookOpen, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHighlightsByBook } from '../../db/highlightsRepository';
import { exportBookToMarkdown, downloadMarkdown } from '../../utils/exportMarkdown';
import { HighlightCard } from './HighlightCard';
import type { Book } from '../../types/book';
import type { Highlight } from '../../types/highlight';

type Props = {
  book: Book;
  onClose: () => void;
};

type Filter = 'all' | 'important';

export function BookDetailView({ book, onClose }: Props) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const loadHighlights = async () => {
    const data = await getHighlightsByBook(book.id);
    setHighlights(data);
    setLoading(false);
  };

  useEffect(() => {
    loadHighlights();
  }, [book.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = useMemo(() => {
    return highlights.filter((h) => {
      if (filter === 'important' && !h.important) return false;
      if (query && !h.text.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [highlights, query, filter]);

  const exportMD = () => {
    const md = exportBookToMarkdown(book, highlights);
    downloadMarkdown(md, `${book.title} - Highlights`);
  };

  const importantCount = highlights.filter((h) => h.important).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-stone-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-200 bg-white px-6 py-5">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                {book.source === 'kindle' ? 'Kindle' : 'Manual'}
              </p>
            </div>
            <h2 className="mt-1 text-lg font-semibold text-stone-900 leading-snug truncate">
              {book.title}
            </h2>
            {book.author && (
              <p className="text-sm text-stone-500 mt-0.5">{book.author}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportMD}
              title="Export to Markdown"
              className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-stone-50 hover:text-stone-700"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-stone-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats + filters */}
        <div className="border-b border-stone-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilter('all')}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                filter === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:bg-stone-100',
              ].join(' ')}
            >
              All · {highlights.length}
            </button>
            {importantCount > 0 && (
              <button
                onClick={() => setFilter('important')}
                className={[
                  'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === 'important'
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-500 hover:bg-stone-100',
                ].join(' ')}
              >
                <Star className="h-3 w-3" />
                Important · {importantCount}
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-stone-200 bg-white px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search highlights…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        {/* Highlight list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-stone-400 text-sm">
              Loading highlights…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-stone-400">
              <p className="text-sm">
                {query ? `No highlights match "${query}"` : 'No highlights yet'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((h) => (
                <HighlightCard key={h.id} highlight={h} onUpdate={loadHighlights} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
