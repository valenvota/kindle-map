import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps, type ResizeParams } from '@xyflow/react';
import { Quote } from 'lucide-react';
import { updateCanvasNodeSize } from '../../../db/canvasRepository';

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

  const handleResizeEnd = (_: unknown, params: ResizeParams) => {
    updateCanvasNodeSize(id, params.width, params.height);
  };

  return (
    <div
      className={[
        'flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-md transition-shadow select-none',
        'cursor-grab active:cursor-grabbing',
        selected
          ? 'border-[#3D6B8E] shadow-lg ring-2 ring-[#3D6B8E]/30'
          : style?.border
            ? 'hover:shadow-lg'
            : 'border-violet-200 hover:border-violet-300 hover:shadow-lg',
      ].join(' ')}
      style={{
        backgroundColor: style?.background ?? '#FFFFFF',
        borderColor: !selected ? style?.border : undefined,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={120}
        onResizeEnd={handleResizeEnd}
        lineClassName="!border-[#3D6B8E]"
        handleClassName="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[#3D6B8E] !bg-white"
      />
      <Handle type="source" id="top"    position={Position.Top} />
      <Handle type="source" id="right"  position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
      <Handle type="source" id="left"   position={Position.Left} />
      {/* Top accent */}
      <div className="h-1 w-full flex-none bg-violet-400" />

      <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
        {/* Quote icon */}
        <Quote className="mb-1.5 h-3.5 w-3.5 flex-none text-violet-400" />

        {/* Quote text */}
        <p
          className={['min-h-0 flex-1 overflow-auto text-sm leading-relaxed italic', style?.text ? '' : 'text-[var(--ink-soft)]'].join(' ')}
          style={{ color: style?.text }}
        >
          {d.content || '(empty quote)'}
        </p>

        {/* Source */}
        <div className="mt-3 flex-none border-t border-[var(--hair)] pt-2">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-violet-500">
            {d.bookTitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export const QuoteNode = memo(QuoteNodeComponent);
