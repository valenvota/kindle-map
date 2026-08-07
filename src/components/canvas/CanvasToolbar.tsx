import { useState } from 'react';
import { ArrowLeft, LayoutGrid, ImageDown, Wallpaper, Check, Map as MapIcon, SquareDashedMousePointer } from 'lucide-react';
import type { MapBackground } from '../../types/map';

type Props = {
  mapName: string;
  background?: MapBackground;
  onBack: () => void;
  onAutoArrange: () => void;
  onExportAll: () => void;
  onExportSelection: () => void;
  hasSelection: boolean;
  onBackgroundChange: (bg: MapBackground) => void;
  exportingImage?: boolean;
};

const WALLPAPERS: { value: MapBackground; label: string }[] = [
  { value: 'dots',  label: 'Dots' },
  { value: 'grid',  label: 'Grid' },
  { value: 'lines', label: 'Lines' },
  { value: 'plain', label: 'Plain' },
];

export function CanvasToolbar({ mapName, background, onBack, onAutoArrange, onExportAll, onExportSelection, hasSelection, onBackgroundChange, exportingImage }: Props) {
  return (
    <div className="km-cvtop km-glass">
      <ToolbarButton icon={<ArrowLeft />} label="Maps" onClick={onBack} />
      <div className="km-cvtop__sep" />
      <span className="km-cvtop__crumb">{mapName}</span>
      <div className="km-cvtop__sep" />
      <ToolbarButton icon={<LayoutGrid />} label="Auto arrange" onClick={onAutoArrange} />
      <WallpaperButton background={background ?? 'dots'} onChange={onBackgroundChange} />
      <ExportButton
        onExportAll={onExportAll}
        onExportSelection={onExportSelection}
        hasSelection={hasSelection}
        exporting={!!exportingImage}
      />
    </div>
  );
}

function ExportButton({ onExportAll, onExportSelection, hasSelection, exporting }: { onExportAll: () => void; onExportSelection: () => void; hasSelection: boolean; exporting: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} title="Export PNG" disabled={exporting} className="km-cvtop__btn">
        <ImageDown />
        <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export PNG'}</span>
      </button>
      {open && !exporting && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="km-menu" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, left: 'auto' }}>
            <button onClick={() => { onExportAll(); setOpen(false); }} className="km-menu__item">
              <MapIcon className="h-4 w-4" /> Export whole map
            </button>
            <button
              onClick={() => { onExportSelection(); setOpen(false); }}
              disabled={!hasSelection}
              className="km-menu__item"
              style={!hasSelection ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            >
              <SquareDashedMousePointer className="h-4 w-4" /> Export selection
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function WallpaperButton({ background, onChange }: { background: MapBackground; onChange: (bg: MapBackground) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} title="Wallpaper" className="km-cvtop__btn">
        <Wallpaper />
        <span className="hidden sm:inline">Wallpaper</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="km-menu" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, left: 'auto' }}>
            {WALLPAPERS.map((w) => (
              <button
                key={w.value}
                onClick={() => { onChange(w.value); setOpen(false); }}
                className="km-menu__item"
              >
                <Check className="h-4 w-4" style={{ visibility: background === w.value ? 'visible' : 'hidden' }} /> {w.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button onClick={onClick} title={label} disabled={disabled} className="km-cvtop__btn">
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
