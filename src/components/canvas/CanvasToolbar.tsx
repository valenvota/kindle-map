import { useState } from 'react';
import { ArrowLeft, LayoutGrid, ImageDown, Wallpaper, Check, Map as MapIcon, SquareDashedMousePointer } from 'lucide-react';
import type { MapBackground } from '../../types/map';

type Props = {
  mapName: string;
  /** Editorial surface title (serif). 'Locus' on the Locus tree; the map name for
   *  a standalone map. Falls back to mapName. */
  surfaceTitle?: string;
  /** Optional tagline under the title (shown only at the Locus root). */
  subtitle?: string;
  /** Locus path (root → current). When present, replaces the plain map name. */
  breadcrumb?: { id: string; name: string }[];
  /** Click an ancestor breadcrumb segment to jump to that map. */
  onCrumb?: (mapId: string) => void;
  /** Label for the back/up button. Defaults to 'Maps'. */
  backLabel?: string;
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

export function CanvasToolbar({ mapName, surfaceTitle, subtitle, breadcrumb, onCrumb, backLabel, background, onBack, onAutoArrange, onExportAll, onExportSelection, hasSelection, onBackgroundChange, exportingImage }: Props) {
  const title = surfaceTitle ?? mapName;
  // Show the breadcrumb context line when it adds information beyond the title:
  // a nested path, or a root whose name differs from the surface title ('Locus'
  // over 'My Locus'). A standalone map (single crumb == title) shows no context.
  const lastCrumb = breadcrumb && breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : undefined;
  const showCrumbs = !!breadcrumb && breadcrumb.length > 0 && (breadcrumb.length > 1 || title !== lastCrumb);

  return (
    <>
      {/* Editorial header — in-flow serif title + context, top-left (Locus mockup).
          Back/up and breadcrumb reuse existing navigation; no new controls. */}
      <div className="km-locushdr">
        <div className="km-locushdr__row">
          <button className="km-locushdr__back" onClick={onBack} title={backLabel ?? 'Maps'} aria-label={backLabel ?? 'Maps'}>
            <ArrowLeft />
          </button>
          <h1 className="km-locushdr__title">{title}</h1>
        </div>
        {subtitle && <div className="km-locushdr__sub">{subtitle}</div>}
        {showCrumbs && (
          <nav className="km-locushdr__crumbs">
            {breadcrumb!.map((c, i) => {
              const last = i === breadcrumb!.length - 1;
              return (
                <span key={c.id} className="flex items-center gap-1.5">
                  {i > 0 && <span className="km-locushdr__crumbsep">/</span>}
                  {last ? (
                    <span className="km-locushdr__crumb km-locushdr__crumb--current">{c.name}</span>
                  ) : (
                    <button className="km-locushdr__crumb" onClick={() => onCrumb?.(c.id)}>
                      {c.name}
                    </button>
                  )}
                </span>
              );
            })}
          </nav>
        )}
      </div>

      {/* Action cluster — top-right (arrange / wallpaper / export). */}
      <div className="km-cvtop km-cvtop--right km-glass">
        <ToolbarButton icon={<LayoutGrid />} label="Auto arrange" onClick={onAutoArrange} />
        <WallpaperButton background={background ?? 'dots'} onChange={onBackgroundChange} />
        <ExportButton
          onExportAll={onExportAll}
          onExportSelection={onExportSelection}
          hasSelection={hasSelection}
          exporting={!!exportingImage}
        />
      </div>
    </>
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
