import { useState } from 'react';
import { Copy, Star, Check } from 'lucide-react';
import { toggleImportant } from '../../db/highlightsRepository';
import type { Highlight } from '../../types/highlight';

type Props = {
  highlight: Highlight;
  onUpdate?: () => void;
  focused?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
};

export function HighlightCard({ highlight, onUpdate, focused, cardRef }: Props) {
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
        'group relative rounded-xl border bg-white p-5 transition-shadow hover:shadow-sm',
        highlight.important ? 'border-amber-300 bg-amber-50/40' : 'border-stone-100',
        focused ? 'ring-2 ring-amber-400' : '',
      ].join(' ')}
    >
      <p className="text-[15px] leading-relaxed text-stone-800">{highlight.text}</p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-2 text-xs text-stone-400">
          {highlight.location && <span>Location {highlight.location}</span>}
          {highlight.page && <span>Page {highlight.page}</span>}
          {highlight.addedAt && <span className="hidden sm:inline">{highlight.addedAt}</span>}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={toggleStar}
            title={highlight.important ? 'Unmark important' : 'Mark as important'}
            className={[
              'rounded-lg p-1.5 transition-colors',
              highlight.important
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-stone-300 hover:text-amber-400',
            ].join(' ')}
          >
            <Star className="h-4 w-4" fill={highlight.important ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={copy}
            title="Copy highlight"
            className="rounded-lg p-1.5 text-stone-300 transition-colors hover:text-stone-600"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
