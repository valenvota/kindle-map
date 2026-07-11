import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronDown, Search, Download, Pencil, GraduationCap,
  AlertCircle, Play,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getHighlightsByBook } from '../../db/highlightsRepository';
import { exportBookToMarkdown, downloadMarkdown } from '../../utils/exportMarkdown';
import { detectAttentionIssues } from '../../utils/cleanBookMetadata';
import { getDisplayTitle } from '../../utils/displayTitle';
import { updateReadingStatus } from '../../db/booksRepository';
import { getGeneralBookNote, upsertGeneralBookNote } from '../../db/bookNotesRepository';
import { HighlightCard } from './HighlightCard';
import { BookEditForm } from './BookEditForm';
import { StudyMode } from './StudyMode';
import { BookCover } from './BookCover';
import { Modal } from '../ui';
import type { Highlight } from '../../types/highlight';
import type { ReadingStatus } from '../../types/book';

const STATUS_LABEL: Record<ReadingStatus, string> = {
  'want-to-read': 'Want to read',
  'reading': 'Reading',
  'finished': 'Finished',
};
const STATUS_DOT: Record<ReadingStatus, string> = {
  'want-to-read': 'want',
  'reading': 'reading',
  'finished': 'finished',
};
const STATUS_CYCLE: (ReadingStatus | null)[] = ['want-to-read', 'reading', 'finished', null];

type Props = {
  bookId: string;
  focusHighlightId?: string | null;
  onClose: () => void;
};

type Tab = 'highlights' | 'notes' | 'study';
type HlFilter = 'all' | 'important';

export function BookDetailView({ bookId, focusHighlightId, onClose }: Props) {
  const liveBook = useLiveQuery(() => db.books.get(bookId), [bookId]);

  const [highlights, setHighlights]   = useState<Highlight[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<Tab>('highlights');
  const [hlFilter, setHlFilter]       = useState<HlFilter>('all');
  const [query, setQuery]             = useState('');
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
    setLoading(true);
    loadHighlights();
    getGeneralBookNote(bookId).then((n) => setGeneralNote(n?.text ?? ''));
  }, [bookId]);

  // Autosave the general book note
  useEffect(() => {
    const timer = setTimeout(() => {
      upsertGeneralBookNote(bookId, generalNote).then(() => {
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 1500);
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [generalNote, bookId]);

  // Jump to a focused highlight when arriving from search
  useEffect(() => {
    if (focusHighlightId) { setTab('highlights'); setHlFilter('all'); setQuery(''); }
  }, [focusHighlightId]);

  useEffect(() => {
    if (!focusHighlightId || loading || tab !== 'highlights') return;
    const el = highlightRefs.current.get(focusHighlightId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusHighlightId, loading, highlights, tab]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isStudying) return;         // StudyMode handles its own Escape
      if (isEditing) setIsEditing(false);
      else onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, isEditing, isStudying]);

  const filtered = useMemo(() => {
    return highlights.filter((h) => {
      if (hlFilter === 'important' && !h.important) return false;
      if (query && !h.text.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [highlights, query, hlFilter]);

  const importantCount = highlights.filter((h) => h.important).length;
  const previewQuote = useMemo(() => {
    const imp = highlights.find((h) => h.important);
    return (imp ?? highlights[0])?.text ?? '';
  }, [highlights]);

  const exportMD = async () => {
    if (!liveBook) return;
    const md = await exportBookToMarkdown(liveBook, highlights);
    downloadMarkdown(md, `${getDisplayTitle(liveBook.title)} - Highlights`);
  };

  const cycleStatus = async () => {
    if (!liveBook) return;
    const current = liveBook.readingStatus ?? null;
    const idx = STATUS_CYCLE.indexOf(current);
    await updateReadingStatus(liveBook.id, STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]);
  };

  if (!liveBook) return null;

  const title = getDisplayTitle(liveBook.title);
  const tags = (liveBook.tags ?? []).filter(Boolean);
  const attentionIssues = detectAttentionIssues(liveBook.title, liveBook.author);
  const status = liveBook.readingStatus ?? null;
  const addedLabel = new Date(liveBook.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  const canStudy = highlights.length > 0;

  return (
    <div className="bd">
      {/* ── Identity rail ─────────────────────────────────────────────────── */}
      <aside className="bd-rail">
        <button className="bd-back" onClick={onClose}>
          <ChevronLeft />
          Library
        </button>

        <div className="bd-cover">
          <BookCover book={liveBook} />
        </div>

        <h1 className="bd-title" title={liveBook.title}>{title}</h1>
        {liveBook.author && <p className="bd-byline">{liveBook.author}</p>}

        {attentionIssues.length > 0 && (
          <div>
            <button className="bd-attention" onClick={() => setIsEditing(true)}>
              <AlertCircle />
              Needs attention · Fix
            </button>
          </div>
        )}

        <div>
          <button className="bd-status" onClick={cycleStatus} title="Click to change reading status">
            {status ? (
              <>
                <span className={`lib-dot lib-dot--${STATUS_DOT[status]}`} />
                {STATUS_LABEL[status]}
              </>
            ) : (
              'Set status'
            )}
            <ChevronDown />
          </button>
        </div>

        <div className="bd-meta">
          <div className="bd-meta__row">
            <span className="bd-meta__k">Source</span>
            <span className="bd-meta__v">{liveBook.source === 'kindle' ? 'Kindle' : 'Manual'}</span>
          </div>
          <div className="bd-meta__row">
            <span className="bd-meta__k">Added</span>
            <span className="bd-meta__v">{addedLabel}</span>
          </div>
          <div className="bd-meta__row">
            <span className="bd-meta__k">Highlights</span>
            <span className="bd-meta__v">{highlights.length}</span>
          </div>
          <div className="bd-meta__row">
            <span className="bd-meta__k">Marked important</span>
            <span className="bd-meta__v bd-meta__v--em">{importantCount}</span>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="bd-tags">
            {tags.map((t) => <span key={t} className="bd-tag">#{t}</span>)}
          </div>
        )}

        <button
          className="bd-study"
          onClick={() => canStudy && setIsStudying(true)}
          disabled={!canStudy}
          title={canStudy ? 'Study this book' : 'No highlights to study'}
        >
          <GraduationCap />
          {canStudy ? `Study ${highlights.length} highlight${highlights.length !== 1 ? 's' : ''}` : 'Nothing to study'}
        </button>
        <div className="bd-actions">
          <button className="bd-ghost" onClick={exportMD} title="Export to Markdown">
            <Download />
            Export
          </button>
          <button className="bd-ghost" onClick={() => setIsEditing(true)} title="Edit metadata">
            <Pencil />
            Edit
          </button>
        </div>
      </aside>

      {/* ── Content column ────────────────────────────────────────────────── */}
      <main className="bd-content">
        <div className="bd-head">
          <div className="km-seg" role="tablist" aria-label="Book view">
            <div
              className="km-seg__thumb"
              style={{ width: 'calc((100% - 6px) / 3)', transform: `translateX(${['highlights', 'notes', 'study'].indexOf(tab) * 100}%)` }}
            />
            {(['highlights', 'notes', 'study'] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={`km-seg__btn${tab === t ? ' on' : ''}`}
                style={{ width: '33.3333%', minWidth: 92, textTransform: 'capitalize' }}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'highlights' && (
            <div className="bd-head__search">
              <Search />
              <input
                placeholder="Search highlights…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="bd-inner">
          {/* Highlights */}
          {tab === 'highlights' && (
            <>
              <div className="bd-hlbar">
                <span className="bd-hlcount"><b>{filtered.length}</b> highlight{filtered.length !== 1 ? 's' : ''}</span>
                <div className="bd-chips">
                  <button className={`bd-chip${hlFilter === 'all' ? ' on' : ''}`} onClick={() => setHlFilter('all')}>All</button>
                  <button className={`bd-chip${hlFilter === 'important' ? ' on' : ''}`} onClick={() => setHlFilter('important')}>Important</button>
                </div>
              </div>

              {loading ? (
                <div className="bd-empty">Loading highlights…</div>
              ) : filtered.length === 0 ? (
                <div className="bd-empty">
                  {query ? (
                    <>No highlights match “{query}”.</>
                  ) : hlFilter === 'important' ? (
                    <>No important highlights yet — star one to mark it.</>
                  ) : liveBook.source === 'kindle' ? (
                    <>No highlights yet. Re-import your Clippings.txt to pull them in.</>
                  ) : (
                    <>Manually added books don’t have imported highlights.</>
                  )}
                </div>
              ) : (
                <div>
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
            </>
          )}

          {/* Notes */}
          {tab === 'notes' && (
            <>
              <h2 className="bd-notes-head">Notes on {title}</h2>
              <p className="bd-notes-sub">Your running thoughts on the whole book · auto-saved</p>
              <textarea
                className="bd-notes-page"
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                placeholder="Write your thoughts, summary, or takeaways about this book…"
              />
              <p className="bd-notes-saved">{noteSaved ? 'Saved' : 'Auto-saves as you type'}</p>
            </>
          )}

          {/* Study */}
          {tab === 'study' && (
            <div className="bd-study-card">
              <div className="bd-study-card__eyebrow">Focused study</div>
              {previewQuote
                ? <p className="bd-study-card__preview">“{previewQuote}”</p>
                : <p className="bd-study-card__preview">No highlights to study yet.</p>}
              <div className="bd-study-card__stats">
                <div className="bd-study-card__stat"><span className="n">{highlights.length}</span><span className="l">Cards</span></div>
                <div className="bd-study-card__stat"><span className="n">{importantCount}</span><span className="l">Important</span></div>
              </div>
              <button className="bd-study-card__go" onClick={() => canStudy && setIsStudying(true)} disabled={!canStudy}>
                <Play />
                Start a session
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Edit metadata */}
      {isEditing && (
        <Modal title="Edit book" onClose={() => setIsEditing(false)} maxWidth={540}>
          <BookEditForm
            book={liveBook}
            onClose={() => setIsEditing(false)}
            onDeleted={onClose}
          />
        </Modal>
      )}

      {/* Study session */}
      {isStudying && (
        <StudyMode
          book={liveBook}
          highlights={highlights}
          onClose={() => setIsStudying(false)}
        />
      )}
    </div>
  );
}
