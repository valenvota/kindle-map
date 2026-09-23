import { useState } from 'react';
import { Copy, Star, Check } from 'lucide-react';
import { toggleImportant } from '../../db/highlightsRepository';
import type { Highlight } from '../../types/highlight';

type Props = {
  highlight: Highlight;
  onUpdate?: () => void;
  focused?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
  /** L3: show a selection checkbox (hover-revealed, persistent once checked). */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
};

/**
 * A highlight rendered as an editorial pulled quote — serif, generous leading.
 * Important highlights carry the ember marker (a left rule + label); status is
 * never shown with colored fills. Hover reveals mark-important + copy actions.
 */
export function HighlightCard({ highlight, onUpdate, focused, cardRef, selectable, selected, onToggleSelect }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(highlight.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleStar = async () => {
    await toggleImportant(highlight.id, !highlight.important);
    onUpdate?.();
  };

  return (
    <div
      ref={cardRef}
      className={[
        'bd-hl',
        highlight.important ? 'bd-hl--important' : '',
        focused ? 'bd-hl--focused' : '',
        selectable ? 'bd-hl--selectable' : '',
        selected ? 'bd-hl--selected' : '',
      ].filter(Boolean).join(' ')}
    >
      {selectable && (
        <button
          type="button"
          role="checkbox"
          aria-checked={!!selected}
          aria-label={selected ? 'Deselect highlight' : 'Select highlight'}
          className={`bd-hl__check${selected ? ' bd-hl__check--on' : ''}`}
          onClick={onToggleSelect}
        >
          {selected && <Check />}
        </button>
      )}

      <p className="bd-hl__q">“{highlight.text}”</p>

      <div className="bd-hl__meta">
        {highlight.important && (
          <span className="bd-hl__tag">
            <Star fill="currentColor" strokeWidth={0} />
            Important
          </span>
        )}
        {highlight.location && <span>Location {highlight.location}</span>}
        {highlight.page && <span>Page {highlight.page}</span>}

        <div className="bd-hl__actions">
          <button
            className="km-iconbtn"
            style={{ width: 28, height: 28 }}
            onClick={toggleStar}
            title={highlight.important ? 'Unmark important' : 'Mark important'}
          >
            <Star
              fill={highlight.important ? 'currentColor' : 'none'}
              style={{ color: highlight.important ? 'var(--ember)' : undefined }}
            />
          </button>
          <button
            className="km-iconbtn"
            style={{ width: 28, height: 28 }}
            onClick={copy}
            title="Copy highlight"
          >
            {copied ? <Check style={{ color: 'var(--accent)' }} /> : <Copy />}
          </button>
        </div>
      </div>
    </div>
  );
}
