import type { Book } from '../../types/book';
import { getDisplayTitle, fullTitle } from '../../utils/displayTitle';

/**
 * Reusable book cover — always feels like a physical book:
 * strict 2:3 ratio, soft shadow, spine highlight, no square cropping.
 *
 *  • Real uploaded cover  → the image, object-fit cover.
 *  • No cover image       → a typographic fallback (Penguin-Great-Ideas style),
 *                           tinted deterministically from the title (or book.color).
 *
 * `variant="row"` renders the compact thumbnail used in the Cards reading index.
 */

type Props = {
  book: Book;
  variant?: 'grid' | 'row';
};

const TINTS: { tint: string; rule: string }[] = [
  { tint: '#E7E3DA', rule: '#46423B' },
  { tint: '#E8E1D3', rule: '#3E6B8E' },
  { tint: '#E1E6EB', rule: '#3E6B8E' },
  { tint: '#E3E8E0', rule: '#40584A' },
  { tint: '#ECE4D6', rule: '#8A5A3E' },
  { tint: '#E6E9DF', rule: '#4A5A3E' },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Fallback cover title shrinks as it gets longer so it never spills out. */
function coverTitleSize(len: number): number {
  if (len > 90) return 12;
  if (len > 60) return 14;
  if (len > 38) return 16;
  return 18;
}

export function BookCover({ book, variant = 'grid' }: Props) {
  const compact = variant === 'row';
  const title = getDisplayTitle(book.title);
  const original = fullTitle(book.title);

  if (book.coverImage) {
    return (
      <div className={`km-cover${compact ? ' km-cover--compact' : ''}`} title={original}>
        <img src={book.coverImage} alt={title} />
      </div>
    );
  }

  const pair = TINTS[hashString(book.title) % TINTS.length];
  const rule = book.color ?? pair.rule;

  if (compact) {
    return (
      <div className="km-cover km-cover--type km-cover--compact" style={{ background: pair.tint }} title={original}>
        <span className="km-cover__ctitle">{title}</span>
      </div>
    );
  }

  const foot = (book.tags ?? []).filter(Boolean)[0];

  return (
    <div className="km-cover km-cover--type" style={{ background: pair.tint }} title={original}>
      <span className="km-cover__rule" style={{ background: rule }} />
      {book.author && <span className="km-cover__author">{book.author}</span>}
      <h3 className="km-cover__title" style={{ fontSize: coverTitleSize(title.length) }}>{title}</h3>
      {foot && <span className="km-cover__foot">#{foot}</span>}
    </div>
  );
}
