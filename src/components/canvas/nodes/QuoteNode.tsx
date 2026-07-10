import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Quote } from 'lucide-react';

export type QuoteNodeData = {
  nodeId: string;
  content: string;
  bookTitle: string;
  bookId: string;
  highlightId: string;
  style?: { background?: string; border?: string; text?: string };
};

function QuoteNodeComponent({ data, selected }: NodeProps) {
  const d = data as QuoteNodeData;
  const style = d.style;

  return (
    <div
      className={[
        'w-56 rounded-2xl border shadow-md transition-shadow select-none',
        'cursor-grab active:cursor-grabbing',
        selected
          ? 'border-[#3D6B8E] shadow-lg ring-2 ring-[#3D6B8E]/30'
          : style?.border
            ? 'hover:shadow-lg'
            : 'border-violet-200 bg-white hover:border-violet-300 hover:shadow-lg',
      ].join(' ')}
      style={{
        backgroundColor: style?.background,
        borderColor: !selected ? style?.border : undefined,
      }}
    >
      <Handle type="source" id="top"    position={Position.Top} />
      <Handle type="source" id="right"  position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
      <Handle type="source" id="left"   position={Position.Left} />
      {/* Top accent */}
      <div className="h-1 w-full rounded-t-2xl bg-violet-400" />

      <div className="px-4 py-3">
        {/* Quote icon */}
        <Quote className="mb-1.5 h-3.5 w-3.5 text-violet-400" />

        {/* Quote text */}
        <p
          className={['line-clamp-5 text-sm leading-relaxed italic', style?.text ? '' : 'text-stone-700'].join(' ')}
          style={{ color: style?.text }}
        >
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
