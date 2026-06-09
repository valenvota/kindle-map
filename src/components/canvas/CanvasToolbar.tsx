import { ArrowLeft, LayoutGrid, Library } from 'lucide-react';

type Props = {
  mapName: string;
  onBack: () => void;       // back to Maps list
  onLibrary: () => void;    // jump straight to Library
  onAutoArrange: () => void;
};

export function CanvasToolbar({ mapName, onBack, onLibrary, onAutoArrange }: Props) {
  return (
    <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-2xl border border-stone-200 bg-white/90 px-2 py-2 shadow-lg backdrop-blur-sm">
        {/* Back to Maps */}
        <ToolbarButton
          icon={<ArrowLeft className="h-4 w-4" />}
          label="Maps"
          onClick={onBack}
        />

        {/* Divider + map name */}
        <div className="mx-1 flex items-center border-x border-stone-100 px-3">
          <span className="max-w-[140px] truncate text-sm font-semibold text-stone-800">
            {mapName}
          </span>
        </div>

        <ToolbarButton
          icon={<LayoutGrid className="h-4 w-4" />}
          label="Auto arrange"
          onClick={onAutoArrange}
        />

        <ToolbarButton
          icon={<Library className="h-4 w-4" />}
          label="Library"
          onClick={onLibrary}
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
