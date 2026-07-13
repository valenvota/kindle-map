import {
  MousePointer2,
  Hand,
  BookOpen,
  Tag,
  FileText,
  Quote,
  Square,
  Circle,
  Pencil,
  Highlighter,
  Eraser,
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
  { kind: 'separator' },
  { kind: 'tool', tool: 'pencil',    icon: <Pencil className="h-4 w-4" />,         label: 'Pencil' },
  { kind: 'tool', tool: 'marker',    icon: <Highlighter className="h-4 w-4" />,    label: 'Marker' },
  { kind: 'tool', tool: 'eraser',    icon: <Eraser className="h-4 w-4" />,         label: 'Eraser' },
];

export function CanvasLeftToolbar() {
  const { activeTool, setActiveTool } = useCanvasTool();

  return (
    <div className="km-cvrail km-glass">
      {TOOLS.map((item, i) => {
        if (item.kind === 'separator') {
          return <div key={i} className="km-cvrail__sep" />;
        }
        const active = activeTool === item.tool;
        const isDrawTool = item.tool === 'pencil' || item.tool === 'marker' || item.tool === 'eraser';
        return (
          <button
            key={item.tool}
            title={item.label}
            onClick={() => setActiveTool(item.tool)}
            className={`km-cvrail__btn${active ? ` on${isDrawTool ? ' draw' : ''}` : ''}`}
          >
            {item.icon}
          </button>
        );
      })}
    </div>
  );
}
