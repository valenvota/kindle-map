import { useState, type ReactNode } from 'react';
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

  return (
    <>
      {/* Editorial header — in-flow serif title + context, top-left (Locus mockup).
          Back/up and breadcrumb reuse existing navigation; no new controls. */}
      <div className="km-locushdr">
        <div className="km-locushdr__row">
          <button className="km-locushdr__back" onClick={onBack} title={backLabel ?? 'Maps'} aria-label={backLabel ?? 'Maps'}>
            <ArrowLeft />
          </button>
          <h1 className="km-locushdr__title" title={title}>{title}</h1>
        </div>
        {subtitle && <div className="km-locushdr__sub">{subtitle}</div>}
        <Breadcrumbs crumbs={breadcrumb ?? []} onCrumb={onCrumb} />
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

/**
 * Locus ancestry (root → current). Visible ancestors are clickable; the current
 * Room is a distinct, non-clickable segment. Beyond 4 levels the middle collapses
 * to `root / … / parent / current`, where `…` is a small dropdown listing the
 * hidden ancestors so none becomes unreachable (L2.3). A single crumb (root, or a
 * standalone map) renders nothing — the header title already says where you are.
 */
function Breadcrumbs({ crumbs, onCrumb }: { crumbs: { id: string; name: string }[]; onCrumb?: (mapId: string) => void }) {
  if (crumbs.length <= 1) return null;

  const sep = (key: string) => <span key={key} className="km-locushdr__crumbsep">/</span>;
  const crumb = (c: { id: string; name: string }, current: boolean) =>
    current ? (
      <span key={c.id} className="km-locushdr__crumb km-locushdr__crumb--current" title={c.name}>{c.name}</span>
    ) : (
      <button key={c.id} className="km-locushdr__crumb" title={c.name} onClick={() => onCrumb?.(c.id)}>{c.name}</button>
    );

  const items: ReactNode[] = [];
  if (crumbs.length <= 4) {
    crumbs.forEach((c, i) => {
      if (i > 0) items.push(sep(`sep-${i}`));
      items.push(crumb(c, i === crumbs.length - 1));
    });
  } else {
    // root / … / parent / current — collapse everything between root and parent.
    const hidden = crumbs.slice(1, crumbs.length - 2);
    items.push(crumb(crumbs[0], false));
    items.push(sep('sep-e'));
    items.push(<CrumbMenu key="crumb-ellipsis" items={hidden} onPick={(id) => onCrumb?.(id)} />);
    items.push(sep('sep-p'));
    items.push(crumb(crumbs[crumbs.length - 2], false));
    items.push(sep('sep-c'));
    items.push(crumb(crumbs[crumbs.length - 1], true));
  }

  return <nav className="km-locushdr__crumbs">{items}</nav>;
}

/** The `…` dropdown for collapsed breadcrumbs: lists hidden ancestors only. */
function CrumbMenu({ items, onPick }: { items: { id: string; name: string }[]; onPick: (mapId: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="km-locushdr__crumbmenu">
      <button
        className="km-locushdr__crumb"
        onClick={() => setOpen((o) => !o)}
        title="Show hidden Rooms"
        aria-label="Show hidden Rooms"
        aria-expanded={open}
      >
        …
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="km-menu" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0 }}>
            {items.map((it) => (
              <button key={it.id} onClick={() => { onPick(it.id); setOpen(false); }} className="km-menu__item">
                {it.name}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
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
