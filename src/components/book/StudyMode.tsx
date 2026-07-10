import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Star, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { toggleImportant } from '../../db/highlightsRepository';
import { getBookNoteByHighlight, upsertBookNote, deleteBookNoteByHighlight } from '../../db/bookNotesRepository';
import type { Book } from '../../types/book';
import type { Highlight } from '../../types/highlight';

type Props = {
  book: Book;
  highlights: Highlight[];
  onClose: () => void;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function StudyMode({ book, highlights, onClose }: Props) {
  const [deck] = useState<Highlight[]>(() => shuffle(highlights));
  const [index, setIndex] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [important, setImportant] = useState(deck[0]?.important ?? false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentHighlight = deck[index];

  // Load existing note + important state when card changes
  useEffect(() => {
    if (!currentHighlight) return;
    setImportant(currentHighlight.important ?? false);
    setNoteText('');
    setSaved(false);
    getBookNoteByHighlight(book.id, currentHighlight.id).then((note) => {
      setNoteText(note?.text ?? '');
    });
  }, [index, currentHighlight?.id]);

  // Auto-save note 600ms after the user stops typing
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!currentHighlight) return;
      if (noteText.trim()) {
        await upsertBookNote(book.id, currentHighlight.id, noteText.trim());
      } else {
        await deleteBookNoteByHighlight(book.id, currentHighlight.id);
      }
      setSaved(true);
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [noteText]);

  const handleToggleImportant = useCallback(async () => {
    if (!currentHighlight) return;
    const next = !important;
    setImportant(next);
    await toggleImportant(currentHighlight.id, next);
  }, [currentHighlight, important]);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, deck.length - 1));
  }, [deck.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  if (!currentHighlight) return null;

  const progress = `${index + 1} / ${deck.length}`;
  const isFirst = index === 0;
  const isLast = index === deck.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-stone-950/97 backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-stone-800 px-6 py-4">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-4 w-4 shrink-0 text-[#C4894A]" />
          <span className="truncate text-sm font-medium text-stone-300">{book.title}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <span className="text-sm font-semibold tabular-nums text-stone-400">{progress}</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-800 hover:text-stone-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Card area */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10">
        <div className="w-full max-w-2xl">
          {/* Highlight card */}
          <div
            className={[
              'rounded-2xl border p-8 shadow-2xl transition-colors',
              important
                ? 'border-[#C4894A]/40 bg-[#C4894A]/10'
                : 'border-stone-800 bg-stone-900',
            ].join(' ')}
          >
            <p className="text-xl font-serif leading-relaxed text-stone-100">
              "{currentHighlight.text}"
            </p>

            {/* Metadata */}
            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-3 text-xs text-stone-600">
                {currentHighlight.location && <span>Location {currentHighlight.location}</span>}
                {currentHighlight.page && <span>Page {currentHighlight.page}</span>}
              </div>

              <button
                onClick={handleToggleImportant}
                title={important ? 'Unmark important' : 'Mark as important'}
                className={[
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  important
                    ? 'bg-[#C4894A]/20 text-[#C4894A] hover:bg-[#C4894A]/30'
                    : 'text-stone-600 hover:bg-stone-800 hover:text-[#C4894A]',
                ].join(' ')}
              >
                <Star
                  className="h-3.5 w-3.5"
                  fill={important ? 'currentColor' : 'none'}
                />
                {important ? 'Important' : 'Mark important'}
              </button>
            </div>
          </div>

          {/* Reflection textarea */}
          <div className="mt-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-600">
              Your reflection
            </label>
            <textarea
              value={noteText}
              onChange={(e) => { setNoteText(e.target.value); setSaved(false); }}
              placeholder="Write a question, thought, or connection…"
              rows={4}
              className={[
                'w-full resize-none rounded-xl border bg-stone-900 px-4 py-3',
                'text-sm leading-relaxed text-stone-200 outline-none',
                'placeholder:text-stone-700',
                'focus:border-[#3D6B8E]/60 focus:ring-1 focus:ring-[#3D6B8E]/40',
                'border-stone-800 transition-colors',
              ].join(' ')}
            />
            <p className={[
              'mt-1 text-right text-xs transition-opacity',
              saved && noteText.trim() ? 'text-stone-600 opacity-100' : 'opacity-0',
            ].join(' ')}>
              Saved
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              onClick={goPrev}
              disabled={isFirst}
              className="flex items-center gap-1.5 rounded-xl border border-stone-800 px-5 py-2.5 text-sm font-medium text-stone-400 transition-colors hover:border-stone-700 hover:text-stone-200 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {/* Progress dots (up to 7 shown) */}
            <div className="flex items-center gap-1.5">
              {deck.slice(Math.max(0, index - 3), index + 4).map((_, i) => {
                const absIdx = Math.max(0, index - 3) + i;
                return (
                  <button
                    key={absIdx}
                    onClick={() => setIndex(absIdx)}
                    className={[
                      'rounded-full transition-all',
                      absIdx === index
                        ? 'h-2.5 w-2.5 bg-[#C4894A]'
                        : 'h-1.5 w-1.5 bg-stone-700 hover:bg-stone-500',
                    ].join(' ')}
                  />
                );
              })}
            </div>

            <button
              onClick={isLast ? onClose : goNext}
              className={[
                'flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors',
                isLast
                  ? 'bg-[#C4894A] text-stone-950 hover:bg-[#d19a5e]'
                  : 'border border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200',
              ].join(' ')}
            >
              {isLast ? 'Finish' : 'Next'}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="mt-8 text-center text-xs text-stone-700">
            ← → to navigate · Esc to close
          </p>
        </div>
      </div>
    </div>
  );
}
