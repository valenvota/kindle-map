import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Map, Trash2, ChevronRight } from 'lucide-react';
import { createMap, deleteMap, getAllMaps } from '../db/mapsRepository';
import { getAllCanvasNodes } from '../db/canvasRepository';
import type { KindleMap } from '../types/map';

type Props = {
  onOpenMap: (mapId: string) => void;
};

export function MapsPage({ onOpenMap }: Props) {
  const allMaps = useLiveQuery(() => getAllMaps(), []);
  const allNodes = useLiveQuery(() => getAllCanvasNodes(), []);

  // The Locus root is product infrastructure, not a user-made Map — it's reached
  // from the sidebar's Locus, never listed here (mirrors countMaps excluding it).
  const maps = useMemo(() => allMaps?.filter((m) => !m.isRoot), [allMaps]);

  const nodeCountByMap = useMemo(() => {
    const counts: Record<string, number> = {};
    allNodes?.forEach((n) => {
      counts[n.mapId] = (counts[n.mapId] ?? 0) + 1;
    });
    return counts;
  }, [allNodes]);

  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="lib-inner">
      {/* ── Masthead ──────────────────────────────────────────────────────── */}
      <header className="mb-9 flex items-end justify-between gap-4">
        <div>
          <h1 className="loci-title">Maps</h1>
          <p className="loci-sub">Standalone canvases, kept alongside your Locus.</p>
        </div>
        <button className="km-btn km-btn--primary km-btn--md" onClick={() => setShowCreate(true)}>
          <Plus />
          New map
        </button>
      </header>

      {maps && maps.length === 0 && (
        <div className="lib-empty">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--accent-soft)' }}>
            <Map className="h-8 w-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>No maps yet</h2>
          <p className="mt-2 max-w-xs text-sm" style={{ color: 'var(--ink-soft)' }}>
            A map is a blank canvas where you add books from your Library and connect ideas.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="km-btn km-btn--primary km-btn--md mt-6"
          >
            <Plus />
            Create your first map
          </button>
        </div>
      )}

      {maps && maps.length > 0 && (
        <>
          <div className="lib-section">
            <span className="lib-section__icon"><Map /></span>
            <span className="lib-section__title">Your maps</span>
            <span className="lib-section__count">{maps.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {maps.map((map) => (
              <MapCard
                key={map.id}
                map={map}
                nodeCount={nodeCountByMap[map.id] ?? 0}
                onOpen={() => onOpenMap(map.id)}
                onDelete={() => deleteMap(map.id)}
              />
            ))}
          </div>
        </>
      )}

      {showCreate && (
        <CreateMapModal
          onClose={() => setShowCreate(false)}
          onCreate={async (name) => {
            const map = await createMap(name);
            setShowCreate(false);
            onOpenMap(map.id);
          }}
        />
      )}
    </div>
  );
}

// ─── MapCard ─────────────────────────────────────────────────────────────────

function MapCard({
  map,
  nodeCount,
  onOpen,
  onDelete,
}: {
  map: KindleMap;
  nodeCount: number;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const createdDate = new Date(map.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="group relative flex flex-col rounded-2xl border p-5 shadow-sm transition-all hover:border-[var(--accent-border)] hover:shadow-md"
      style={{ borderColor: 'var(--hair)', background: 'var(--surface)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--accent-soft)' }}
          >
            <Map className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="font-display line-clamp-2 text-[15px] font-medium leading-snug" style={{ color: 'var(--ink)' }}>{map.name}</h3>
        </div>

        {!confirmDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="km-iconbtn shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            title="Delete map"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {confirmDelete && (
        <div className="mt-3 rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--hair-md)', background: 'var(--surface-2)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--ink)' }}>Delete this map?</p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-faint)' }}>Books and highlights are not affected.</p>
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="km-btn km-btn--danger km-btn--sm flex-1"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="km-btn km-btn--secondary km-btn--sm flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!confirmDelete && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
            {nodeCount} element{nodeCount !== 1 ? 's' : ''} · {createdDate}
          </span>
          <button onClick={onOpen} className="km-btn km-btn--secondary km-btn--sm">
            Open
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CreateMapModal ───────────────────────────────────────────────────────────

function CreateMapModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onCreate(name.trim());
  };

  return (
    <div className="km-modal__backdrop" onClick={onClose}>
      <form className="km-modal__panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="km-modal__head">
          <h2 className="km-modal__title">New map</h2>
        </div>
        <div className="km-modal__body">
          <p style={{ marginBottom: 14 }}>Give your map a name. You can always rename it later.</p>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Philosophy reading list"
            className="km-field"
          />
        </div>
        <div className="km-modal__foot">
          <button type="button" onClick={onClose} className="km-btn km-btn--secondary km-btn--md">
            Cancel
          </button>
          <button type="submit" disabled={!name.trim()} className="km-btn km-btn--primary km-btn--md">
            Create map
          </button>
        </div>
      </form>
    </div>
  );
}
