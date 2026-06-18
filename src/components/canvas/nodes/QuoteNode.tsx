import { memo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';
import { Quote } from 'lucide-react';
import { useCanvasTool } from '../CanvasToolContext';

export type QuoteNodeData = {
  nodeId: string;
  content: string;
  bookTitle: string;
  bookId: string;
  highlightId: string;
  style?: { background?: string; border?: string; text?: string };
};

function QuoteNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as QuoteNodeData;
  const style = d.style;
  const { activeTool, arrowSourceId } = useCanvasTool();
  const arrowMode = activeTool === 'arrow';
  const isArrowSource = arrowSourceId === id;

  return (
    <>
    {arrowMode && (
      <>
        <Handle id="top"    type="source" position={Position.Top}    className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
        <Handle id="bottom" type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
        <Handle id="left"   type="source" position={Position.Left}   className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
        <Handle id="right"  type="source" position={Position.Right}  className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
      </>
    )}
    <div
      className={[
        'w-56 rounded-2xl border shadow-md transition-shadow select-none',
        'cursor-grab active:cursor-grabbing',
        isArrowSource
          ? 'border-amber-500 shadow-lg ring-4 ring-amber-300 bg-white'
          : selected
            ? 'border-violet-400 shadow-lg ring-2 ring-violet-200'
            : style?.border
              ? 'hover:shadow-lg'
              : 'border-violet-200 bg-white hover:border-violet-300 hover:shadow-lg',
      ].join(' ')}
      style={{
        backgroundColor: style?.background,
        borderColor: !selected ? style?.border : undefined,
      }}
    >
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
    </>
  );
}

export const QuoteNode = memo(QuoteNodeComponent);
