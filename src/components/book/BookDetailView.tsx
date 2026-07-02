import { useEffect, useState, useMemo, useRef } from 'react';
import { X, Search, Download, BookOpen, Star, Pencil, AlertCircle, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getHighlightsByBook } from '../../db/highlightsRepository';
import { exportBookToMarkdown, downloadMarkdown } from '../../utils/exportMarkdown';
import { detectAttentionIssues, issueLabel } from '../../utils/cleanBookMetadata';
import { HighlightCard } from './HighlightCard';
import { BookEditForm } from './BookEditForm';
import { StudyMode } from './StudyMode';
import type { Highlight } from '../../types/highlight';

type Props = {
  bookId: string;
  focusHighlightId?: string | null;
  onClose: () => void;
};

type Filter = 'all' | 'important';

export function BookDetailView({ bookId, focusHighlightId, onClose }: Props) {
  const liveBook = useLiveQuery(() => db.books.get(bookId), [bookId]);

  const [highlights, setHighlights]   = useState<Highlight[]>([]);
  const [loading, setLoading]         = useState(true);
  const [query, setQuery]             = useState('');
  const [filter, setFilter]           = useState<Filter>('all');
  const [isEditing, setIsEditing]     = useState(false);
  const [isStudying, setIsStudying]   = useState(false);
  const highlightRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const loadHighlights = async () => {
    const data = await getHighlightsByBook(bookId);
    setHighlights(data);
    setLoading(false);
  };

  useEffect(() => {
    loadHighlights();
  }, [bookId]);

  // When opened to focus a specific highlight, make sure it's visible
  useEffect(() => {
    if (focusHighlightId) {
      setFilter('all');
      setQuery('');
    }
  }, [focusHighlightId]);

  // Scroll the focused highlight into view once it's rendered
  useEffect(() => {
    if (!focusHighlightId || loading) return;
    const el = highlightRefs.current.get(focusHighlightId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusHighlightId, loading, highlights]);

  // Close on Escape — if editing, Escape cancels edit; otherwise closes drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) setIsEditing(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, isEditing]);

  const filtered = useMemo(() => {
    return highlights.filter((h) => {
      if (filter === 'important' && !h.important) return false;
      if (query && !h.text.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [highlights, query, filter]);

  const exportMD = () => {
    if (!liveBook) return;
    const md = exportBookToMarkdown(liveBook, highlights);
    downloadMarkdown(md, `${liveBook.title} - Highlights`);
  };

  const importantCount = highlights.filter((h) => h.important).length;
  const attentionIssues = liveBook ? detectAttentionIssues(liveBook.title, liveBook.author) : [];

  if (!liveBook) return null;

  return (
    <>
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
          {!isEditing && liveBook.coverImage && (
            <img
              src={liveBook.coverImage}
              alt=""
              className="mr-4 h-20 w-14 shrink-0 rounded-lg object-cover shadow-sm"
            />
          )}
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                {liveBook.source === 'kindle' ? 'Kindle' : 'Manual'}
              </p>
              {/* Attention badge */}
              {attentionIssues.length > 0 && !isEditing && (
                <span
                  title={attentionIssues.map(issueLabel).join(' · ')}
                  className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600"
                >
                  <AlertCircle className="h-3 w-3" />
                  Needs attention
                </span>
              )}
            </div>
            <h2 className="mt-1 truncate text-lg font-semibold leading-snug text-stone-900">
              {liveBook.title}
            </h2>
            {liveBook.author && (
              <p className="mt-0.5 text-sm text-stone-500">{liveBook.author}</p>
            )}

            {/* Tags */}
            {!isEditing && (liveBook.tags ?? []).filter(Boolean).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(liveBook.tags ?? []).filter(Boolean).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={exportMD}
                  title="Export to Markdown"
                  className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  title="Edit metadata"
                  className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => highlights.length > 0 && setIsStudying(true)}
                  title={highlights.length === 0 ? 'No highlights to study' : 'Study this book'}
                  disabled={highlights.length === 0}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Study
                </button>
              </>
            )}
            <button
              onClick={isEditing ? () => setIsEditing(false) : onClose}
              className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-stone-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Edit mode ── */}
        {isEditing ? (
          <div className="flex-1 overflow-y-auto">
            <BookEditForm
              book={liveBook}
              onClose={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <>
            {/* Attention issues detail (only when not editing) */}
            {attentionIssues.length > 0 && (
              <div className="border-b border-orange-100 bg-orange-50 px-6 py-2">
                <p className="text-xs text-orange-600">
                  {attentionIssues.map(issueLabel).join(' · ')}
                  {' · '}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="font-semibold underline hover:text-orange-800"
                  >
                    Fix now
                  </button>
                </p>
              </div>
            )}

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
                <div className="flex items-center justify-center py-16 text-sm text-stone-400">
                  Loading highlights…
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  {query ? (
                    <>
                      <p className="text-sm text-stone-400">No highlights match "{query}"</p>
                      <button
                        onClick={() => setQuery('')}
                        className="mt-2 text-xs font-medium text-amber-600 underline hover:text-amber-800"
                      >
                        Clear search
                      </button>
                    </>
                  ) : filter === 'important' ? (
                    <>
                      <p className="text-sm font-medium text-stone-500">No important highlights yet</p>
                      <p className="mt-1 text-xs text-stone-400">Star a highlight to mark it as important.</p>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100">
                        <span className="text-xl">✨</span>
                      </div>
                      <p className="text-sm font-medium text-stone-500">No highlights yet</p>
                      <p className="mt-1 max-w-[220px] text-xs text-stone-400">
                        {liveBook.source === 'kindle'
                          ? 'Re-import your Clippings.txt to pull in highlights for this book.'
                          : 'Manually added books don\'t have auto-imported highlights.'}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filtered.map((h) => (
                    <HighlightCard
                      key={h.id}
                      highlight={h}
                      onUpdate={loadHighlights}
                      focused={h.id === focusHighlightId}
                      cardRef={(el) => highlightRefs.current.set(h.id, el)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>

    {isStudying && (
      <StudyMode
        book={liveBook}
        highlights={highlights}
        onClose={() => setIsStudying(false)}
      />
    )}
    </>
  );
}
