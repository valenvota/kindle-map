import { useEffect, useState } from 'react';
import { Check, X, Loader2, ImageOff } from 'lucide-react';
import { findCoverByTitleAuthor, coverUrlToDataUri } from '../../utils/openLibraryCovers';
import { updateBookCover } from '../../db/booksRepository';
import type { NewBookInfo } from '../../hooks/useImportClippings';

type SuggestionStatus = 'loading' | 'found' | 'not_found' | 'accepted' | 'skipped';

type BookSuggestion = {
  book: NewBookInfo;
  status: SuggestionStatus;
  coverDataUri?: string;
};

type Props = {
  newBooks: NewBookInfo[];
};

export function CoverSuggestionFlow({ newBooks }: Props) {
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>(
    newBooks.map((book) => ({ book, status: 'loading' })),
  );

  // Fetch covers for all new books on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      for (let i = 0; i < newBooks.length; i++) {
        const b = newBooks[i];
        const candidate = await findCoverByTitleAuthor(b.title, b.author ?? '');
        if (cancelled) return;

        if (!candidate) {
          setSuggestions((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'not_found' } : s)),
          );
          continue;
        }

        const dataUri = await coverUrlToDataUri(candidate.coverUrl);
        if (cancelled) return;

        setSuggestions((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? { ...s, status: dataUri ? 'found' : 'not_found', coverDataUri: dataUri ?? undefined }
              : s,
          ),
        );
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  async function accept(index: number) {
    const s = suggestions[index];
    if (!s.coverDataUri) return;
    await updateBookCover(s.book.id, s.coverDataUri);
    setSuggestions((prev) =>
      prev.map((sg, idx) => (idx === index ? { ...sg, status: 'accepted' } : sg)),
    );
  }

  function skip(index: number) {
    setSuggestions((prev) =>
      prev.map((sg, idx) => (idx === index ? { ...sg, status: 'skipped' } : sg)),
    );
  }

  const pending = suggestions.filter((s) => s.status === 'loading' || s.status === 'found');
  const done = suggestions.filter((s) => s.status === 'accepted' || s.status === 'skipped' || s.status === 'not_found');

  if (newBooks.length === 0) return null;

  return (
    <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--hair-md)' }}>
      <p className="km-label mb-3">
        Cover suggestions · {newBooks.length} new book{newBooks.length > 1 ? 's' : ''}
      </p>

      <div className="flex flex-col gap-3">
        {suggestions.map((s, i) => (
          <SuggestionCard
            key={s.book.id}
            suggestion={s}
            onAccept={() => accept(i)}
            onSkip={() => skip(i)}
          />
        ))}
      </div>

      {pending.length === 0 && done.length > 0 && (
        <p className="mt-3 text-xs" style={{ color: 'var(--ink-faint)' }}>
          {suggestions.filter((s) => s.status === 'accepted').length} cover
          {suggestions.filter((s) => s.status === 'accepted').length !== 1 ? 's' : ''} added.
        </p>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onAccept,
  onSkip,
}: {
  suggestion: BookSuggestion;
  onAccept: () => void;
  onSkip: () => void;
}) {
  const { book, status, coverDataUri } = suggestion;

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--hair-md)', background: 'var(--surface)' }}>
      {/* Cover preview */}
      <div className="h-16 w-11 shrink-0 overflow-hidden rounded-md" style={{ background: 'var(--surface-2)' }}>
        {status === 'loading' && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--ink-faint)' }} />
          </div>
        )}
        {status === 'not_found' && (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-4 w-4" style={{ color: 'var(--ink-faint)' }} />
          </div>
        )}
        {(status === 'found' || status === 'accepted') && coverDataUri && (
          <img src={coverDataUri} alt="" className="h-full w-full object-cover" />
        )}
        {status === 'skipped' && (
          <div className="flex h-full items-center justify-center">
            <X className="h-4 w-4" style={{ color: 'var(--ink-faint)' }} />
          </div>
        )}
      </div>

      {/* Book info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>{book.title}</p>
        {book.author && (
          <p className="truncate text-xs" style={{ color: 'var(--ink-faint)' }}>{book.author}</p>
        )}
        {status === 'not_found' && (
          <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>No cover found</p>
        )}
        {status === 'accepted' && (
          <p className="text-xs font-medium text-green-600">Cover added ✓</p>
        )}
        {status === 'skipped' && (
          <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Skipped</p>
        )}
      </div>

      {/* Actions */}
      {status === 'found' && (
        <div className="flex shrink-0 gap-1.5">
          <button onClick={onAccept} className="km-btn km-btn--primary km-btn--sm">
            <Check className="h-3 w-3" />
            Add
          </button>
          <button onClick={onSkip} className="km-btn km-btn--secondary km-btn--sm">
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
