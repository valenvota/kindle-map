import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Quote } from 'lucide-react';

export type QuoteNodeData = {
  nodeId: string;
  content: string;
  bookTitle: string;
  bookId: string;
  highlightId: string;
};

function QuoteNodeComponent({ data, selected }: NodeProps) {
  const d = data as QuoteNodeData;

  return (
    <div
      className={[
        'w-56 rounded-2xl border bg-white shadow-md transition-shadow select-none',
        'cursor-grab active:cursor-grabbing',
        selected
          ? 'border-violet-400 shadow-lg ring-2 ring-violet-200'
          : 'border-violet-200 hover:border-violet-300 hover:shadow-lg',
      ].join(' ')}
    >
      {/* Top accent */}
      <div className="h-1 w-full rounded-t-2xl bg-violet-400" />

      <div className="px-4 py-3">
        {/* Quote icon */}
        <Quote className="mb-1.5 h-3.5 w-3.5 text-violet-400" />

        {/* Quote text */}
        <p className="line-clamp-5 text-sm leading-relaxed text-stone-700 italic">
          {d.content || '(empty quote)'}
        </p>

        {/* Source */}
        <div className="mt-3 border-t border-stone-100 pt-2">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-violet-500">
            {d.bookTitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export const QuoteNode = memo(QuoteNodeComponent);
