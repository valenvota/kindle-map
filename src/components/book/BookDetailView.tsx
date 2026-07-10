import { useEffect, useState, useMemo, useRef } from 'react';
import { X, Search, Download, BookOpen, Star, Pencil, AlertCircle, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getHighlightsByBook } from '../../db/highlightsRepository';
import { exportBookToMarkdown, downloadMarkdown } from '../../utils/exportMarkdown';
import { detectAttentionIssues, issueLabel } from '../../utils/cleanBookMetadata';
import { updateReadingStatus } from '../../db/booksRepository';
import { getGeneralBookNote, upsertGeneralBookNote } from '../../db/bookNotesRepository';
import { HighlightCard } from './HighlightCard';
import { BookEditForm } from './BookEditForm';
import { StudyMode } from './StudyMode';
import type { Highlight } from '../../types/highlight';
import type { ReadingStatus } from '../../types/book';

const STATUS_CONFIG: Record<ReadingStatus, { label: string; emoji: string; style: React.CSSProperties; borderStyle: React.CSSProperties }> = {
  'want-to-read': {
    label: 'Want to read', emoji: '📚',
    style: { background: 'rgba(122,106,84,0.10)', color: '#7A6A54' },
    borderStyle: { borderColor: 'rgba(122,106,84,0.25)' },
  },
  'reading': {
    label: 'Reading', emoji: '📖',
    style: { background: 'rgba(61,107,142,0.10)', color: '#3D6B8E' },
    borderStyle: { borderColor: 'rgba(61,107,142,0.25)' },
  },
  'finished': {
    label: 'Finished', emoji: '✅',
    style: { background: 'rgba(58,122,92,0.10)', color: '#3A7A5C' },
    borderStyle: { borderColor: 'rgba(58,122,92,0.25)' },
  },
};
const STATUS_CYCLE: (ReadingStatus | null)[] = ['want-to-read', 'reading', 'finished', null];

type Props = {
  bookId: string;
  focusHighlightId?: string | null;
  onClose: () => void;
};

type Filter = 'all' | 'important' | 'notes';

export function BookDetailView({ bookId, focusHighlightId, onClose }: Props) {
  const liveBook = useLiveQuery(() => db.books.get(bookId), [bookId]);

  const [highlights, setHighlights]   = useState<Highlight[]>([]);
  const [loading, setLoading]         = useState(true);
  const [query, setQuery]             = useState('');
  const [filter, setFilter]           = useState<Filter>('all');
  const [isEditing, setIsEditing]     = useState(false);
  const [isStudying, setIsStudying]   = useState(false);
  const [generalNote, setGeneralNote] = useState('');
  const [noteSaved, setNoteSaved]     = useState(false);
  const highlightRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const loadHighlights = async () => {
    const data = await getHighlightsByBook(bookId);
    setHighlights(data);
    setLoading(false);
  };

  useEffect(() => {
    loadHighlights();
    getGeneralBookNote(bookId).then((n) => setGeneralNote(n?.text ?? ''));
  }, [bookId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      upsertGeneralBookNote(bookId, generalNote).then(() => {
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 1500);
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [generalNote, bookId]);

  useEffect(() => {
    if (focusHighlightId) { setFilter('all'); setQuery(''); }
  }, [focusHighlightId]);

  useEffect(() => {
    if (!focusHighlightId || loading) return;
    const el = highlightRefs.current.get(focusHighlightId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusHighlightId, loading, highlights]);

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

  const exportMD = async () => {
    if (!liveBook) return;
    const md = await exportBookToMarkdown(liveBook, highlights);
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
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col shadow-2xl"
        style={{ background: 'var(--bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between border-b px-6 py-5"
          style={{ borderColor: 'var(--border-md)', background: 'var(--surface)' }}
        >
          {!isEditing && liveBook.coverImage && (
            <img
              src={liveBook.coverImage}
              alt=""
              className="mr-4 h-20 w-14 shrink-0 rounded-lg object-cover shadow-sm"
            />
          )}
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
              <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--accent)' }}>
                {liveBook.source === 'kindle' ? 'Kindle' : 'Manual'}
              </p>
              {attentionIssues.length > 0 && !isEditing && (
                <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                  <AlertCircle className="h-3 w-3" />
                  Needs attention
                </span>
              )}
            </div>
            <h2 className="mt-1 truncate text-lg font-semibold leading-snug" style={{ color: 'var(--text)' }}>
              {liveBook.title}
            </h2>
            {liveBook.author && (
              <p className="mt-0.5 text-sm" style={{ color: 'var(--text-2)' }}>{liveBook.author}</p>
            )}

            {/* Reading status pill */}
            {!isEditing && (
              <div className="mt-2">
                <button
                  onClick={async () => {
                    const current = liveBook.readingStatus ?? null;
                    const idx = STATUS_CYCLE.indexOf(current);
                    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
                    await updateReadingStatus(liveBook.id, next);
                  }}
                  title="Click to change reading status"
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-75"
                  style={liveBook.readingStatus
                    ? { ...STATUS_CONFIG[liveBook.readingStatus].style, ...STATUS_CONFIG[liveBook.readingStatus].borderStyle }
                    : { borderColor: 'var(--border-md)', color: 'var(--text-3)' }}
                >
                  {liveBook.readingStatus ? (
                    <>{STATUS_CONFIG[liveBook.readingStatus].emoji} {STATUS_CONFIG[liveBook.readingStatus].label}</>
                  ) : (
                    '+ Set status'
                  )}
                </button>
              </div>
            )}

            {/* Tags */}
            {!isEditing && (liveBook.tags ?? []).filter(Boolean).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(liveBook.tags ?? []).filter(Boolean).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
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
                  className="rounded-lg border p-2 transition-colors hover:bg-stone-50"
                  style={{ borderColor: 'var(--border-md)', color: 'var(--text-3)' }}
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  title="Edit metadata"
                  className="rounded-lg border p-2 transition-colors hover:bg-stone-50"
                  style={{ borderColor: 'var(--border-md)', color: 'var(--text-3)' }}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => highlights.length > 0 && setIsStudying(true)}
                  title={highlights.length === 0 ? 'No highlights to study' : 'Study this book'}
                  disabled={highlights.length === 0}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: 'var(--accent-border)', background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(61,107,142,0.16)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-soft)'; }}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Study
                </button>
              </>
            )}
            <button
              onClick={isEditing ? () => setIsEditing(false) : onClose}
              className="rounded-lg border p-2 transition-colors hover:bg-stone-50"
              style={{ borderColor: 'var(--border-md)', color: 'var(--text-3)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Edit mode */}
        {isEditing ? (
          <div className="flex-1 overflow-y-auto">
            <BookEditForm
              book={liveBook}
              onClose={() => setIsEditing(false)}
              onDeleted={onClose}
            />
          </div>
        ) : (
          <>
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

            {/* Tab bar */}
            <div
              className="border-b px-6"
              style={{ borderColor: 'var(--border-md)', background: 'var(--surface)' }}
            >
              <div className="flex items-center gap-0">
                {([
                  { key: 'all', label: `All · ${highlights.length}` },
                  ...(importantCount > 0 ? [{ key: 'important', label: `★ Important · ${importantCount}` }] : []),
                  { key: 'notes', label: '📝 Notes' },
                ] as { key: Filter; label: string }[]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className="relative px-4 py-3 text-xs font-semibold transition-colors"
                    style={filter === tab.key
                      ? { color: 'var(--brand)', borderBottom: '2px solid var(--brand)' }
                      : { color: 'var(--text-3)', borderBottom: '2px solid transparent' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes panel */}
            {filter === 'notes' ? (
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-3)' }}>
                  Your notes on this book
                </p>
                <textarea
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  placeholder="Write your thoughts, summary, or takeaways about this book…"
                  className="w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm outline-none placeholder:text-stone-300 transition-colors"
                  style={{ borderColor: 'var(--border-md)', color: 'var(--text)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(61,107,142,0.10)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-md)'; e.target.style.boxShadow = 'none'; }}
                  rows={12}
                />
                <p className="mt-1.5 text-right text-xs" style={{ color: 'var(--text-3)' }}>
                  {noteSaved ? '✓ Saved' : 'Auto-saves as you type'}
                </p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div
                  className="border-b px-6 py-3"
                  style={{ borderColor: 'var(--border-md)', background: 'var(--surface)' }}
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input
                      type="text"
                      placeholder="Search highlights…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm outline-none transition-colors"
                      style={{ borderColor: 'var(--border-md)', color: 'var(--text)' }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(61,107,142,0.10)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border-md)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Highlight list */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--text-3)' }}>
                      Loading highlights…
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      {query ? (
                        <>
                          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No highlights match "{query}"</p>
                          <button
                            onClick={() => setQuery('')}
                            className="mt-2 text-xs font-medium underline"
                            style={{ color: 'var(--accent)' }}
                          >
                            Clear search
                          </button>
                        </>
                      ) : filter === 'important' ? (
                        <>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>No important highlights yet</p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>Star a highlight to mark it as important.</p>
                        </>
                      ) : (
                        <>
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-2)' }}>
                            <span className="text-xl">✨</span>
                          </div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>No highlights yet</p>
                          <p className="mt-1 max-w-[220px] text-xs" style={{ color: 'var(--text-3)' }}>
                            {liveBook.source === 'kindle'
                              ? 'Re-import your Clippings.txt to pull in highlights for this book.'
                              : "Manually added books don't have auto-imported highlights."}
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
