import { Upload, LayoutGrid, List } from 'lucide-react';

type Props = {
  view: 'canvas' | 'list';
  onToggleView: () => void;
  onImport: () => void;
  onAutoArrange: () => void;
};

export function CanvasToolbar({ view, onToggleView, onImport, onAutoArrange }: Props) {
  return (
    <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-2xl border border-stone-200 bg-white/90 px-2 py-2 shadow-lg backdrop-blur-sm">
        {/* Brand */}
        <div className="flex items-center gap-1.5 px-2 pr-3 border-r border-stone-100 mr-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500">
            <span className="text-xs font-bold text-white">K</span>
          </div>
          <span className="text-sm font-semibold text-stone-800">KindleMap</span>
        </div>

        <ToolbarButton
          icon={<Upload className="h-4 w-4" />}
          label="Import"
          onClick={onImport}
        />

        <ToolbarButton
          icon={<LayoutGrid className="h-4 w-4" />}
          label="Auto arrange"
          onClick={onAutoArrange}
        />

        <ToolbarButton
          icon={<List className="h-4 w-4" />}
          label={view === 'canvas' ? 'List view' : 'Canvas view'}
          onClick={onToggleView}
          active={view === 'list'}
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={[
        'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-stone-900 text-white'
          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
      ].join(' ')}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
