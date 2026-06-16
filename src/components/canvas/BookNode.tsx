import { memo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';
import { BookOpen } from 'lucide-react';
import type { Book } from '../../types/book';
import { useCanvasTool } from './CanvasToolContext';

export type BookNodeData = {
  book: Book;
};

const ACCENT_COLORS = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ef4444', // red
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ec4899', // pink
];

function getAccentColor(book: Book): string {
  if (book.color) return book.color;
  // Derive a stable color from the book id
  const idx = book.id.charCodeAt(0) % ACCENT_COLORS.length;
  return ACCENT_COLORS[idx];
}

function BookNodeComponent({ data, selected }: NodeProps) {
  const { book } = data as BookNodeData;
  const accent = getAccentColor(book);
  const { activeTool } = useCanvasTool();
  const arrowMode = activeTool === 'arrow';

  return (
    <>
    {arrowMode && (
      <>
        <Handle type="source" position={Position.Top}    className="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-white" />
        <Handle type="source" position={Position.Bottom} className="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-white" />
        <Handle type="source" position={Position.Left}   className="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-white" />
        <Handle type="source" position={Position.Right}  className="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-white" />
        <Handle type="target" position={Position.Top}    className="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-white" />
        <Handle type="target" position={Position.Bottom} className="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-white" />
        <Handle type="target" position={Position.Left}   className="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-white" />
        <Handle type="target" position={Position.Right}  className="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-white" />
      </>
    )}
    <div
      className={[
        'group relative w-52 rounded-2xl border bg-white shadow-sm transition-shadow',
        'cursor-grab active:cursor-grabbing select-none',
        selected
          ? 'border-stone-400 shadow-lg ring-2 ring-stone-300'
          : 'border-stone-200 hover:border-stone-300 hover:shadow-md',
      ].join(' ')}
      style={{ userSelect: 'none' }}
    >
      {/* Color accent bar */}
      <div
        className="h-1.5 w-full rounded-t-2xl"
        style={{ backgroundColor: accent }}
      />

      <div className="p-4">
        {/* Source badge */}
        <div className="mb-2 flex items-center gap-1.5">
          <BookOpen className="h-3 w-3 shrink-0" style={{ color: accent }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
            {book.source === 'kindle' ? 'Kindle' : 'Manual'}
          </span>
        </div>

        {/* Title */}
        <h3 className="line-clamp-3 text-sm font-semibold leading-snug text-stone-900">
          {book.title}
        </h3>

        {/* Author */}
        {book.author && (
          <p className="mt-1 line-clamp-1 text-xs text-stone-500">{book.author}</p>
        )}

        {/* Highlight count */}
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
            {book.totalHighlights} highlights
          </span>
        </div>

        {/* Double-click hint — only visible on hover */}
        <p className="mt-2 text-center text-[10px] text-stone-300 opacity-0 transition-opacity group-hover:opacity-100">
          double-click to open
        </p>
      </div>
    </div>
    </>
  );
}

export const BookNode = memo(BookNodeComponent);
