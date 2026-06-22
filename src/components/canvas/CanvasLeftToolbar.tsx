import {
  MousePointer2,
  Hand,
  BookOpen,
  Tag,
  FileText,
  Quote,
  Square,
  Circle,
} from 'lucide-react';
import { useCanvasTool, type CanvasTool } from './CanvasToolContext';

type ToolItem =
  | { kind: 'tool'; tool: CanvasTool; icon: React.ReactNode; label: string }
  | { kind: 'separator' };

const TOOLS: ToolItem[] = [
  { kind: 'tool', tool: 'select',    icon: <MousePointer2 className="h-4 w-4" />, label: 'Select' },
  { kind: 'tool', tool: 'pan',       icon: <Hand className="h-4 w-4" />,           label: 'Pan' },
  { kind: 'separator' },
  { kind: 'tool', tool: 'book',      icon: <BookOpen className="h-4 w-4" />,       label: 'Book' },
  { kind: 'tool', tool: 'topic',     icon: <Tag className="h-4 w-4" />,            label: 'Topic' },
  { kind: 'tool', tool: 'note',      icon: <FileText className="h-4 w-4" />,       label: 'Note' },
  { kind: 'tool', tool: 'quote',     icon: <Quote className="h-4 w-4" />,          label: 'Quote' },
  { kind: 'separator' },
  { kind: 'tool', tool: 'rectangle', icon: <Square className="h-4 w-4" />,         label: 'Rectangle' },
  { kind: 'tool', tool: 'circle',    icon: <Circle className="h-4 w-4" />,         label: 'Circle' },
];

// Arrows/edges were paused in Sprint 11 — see README roadmap note.

export function CanvasLeftToolbar() {
  const { activeTool, setActiveTool } = useCanvasTool();

  return (
    <div className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex flex-col items-center gap-1 rounded-2xl border border-stone-200 bg-white px-1.5 py-2 shadow-lg">
      {TOOLS.map((item, i) => {
        if (item.kind === 'separator') {
          return <div key={i} className="my-1 h-px w-6 bg-stone-200" />;
        }
        const active = activeTool === item.tool;
        return (
          <button
            key={item.tool}
            title={item.label}
            onClick={() => setActiveTool(item.tool)}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              active
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800',
            ].join(' ')}
          >
            {item.icon}
          </button>
        );
      })}
    </div>
  );
}
