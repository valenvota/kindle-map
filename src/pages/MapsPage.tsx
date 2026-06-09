import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, Map, Trash2, ChevronRight } from 'lucide-react';
import { db } from '../db/db';
import { createMap, deleteMap } from '../db/mapsRepository';
import type { KindleMap } from '../types/map';

type Props = {
  onBack: () => void;
  onOpenMap: (mapId: string) => void;
};

export function MapsPage({ onBack, onOpenMap }: Props) {
  const maps = useLiveQuery(() => db.maps.orderBy('createdAt').toArray(), []);
  const allNodes = useLiveQuery(() => db.canvasNodes.toArray(), []);

  const nodeCountByMap = useMemo(() => {
    const counts: Record<string, number> = {};
    allNodes?.forEach((n) => {
      counts[n.mapId] = (counts[n.mapId] ?? 0) + 1;
    });
    return counts;
  }, [allNodes]);

  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Library
            </button>
            <span className="text-stone-300">/</span>
            <h1 className="text-sm font-semibold text-stone-900">Maps</h1>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            <Plus className="h-4 w-4" />
            New map
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Empty state */}
        {maps && maps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
              <Map className="h-8 w-8 text-stone-400" />
            </div>
            <h2 className="text-lg font-semibold text-stone-800">No maps yet</h2>
            <p className="mt-2 max-w-xs text-sm text-stone-500">
              A map is a blank canvas where you add books from your Library and connect ideas.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600"
            >
              <Plus className="h-4 w-4" />
              Create your first map
            </button>
          </div>
        )}

        {/* Map grid */}
        {maps && maps.length > 0 && (
          <>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-stone-900">Your Maps</span>
              <span className="text-sm text-stone-400">{maps.length} map{maps.length !== 1 ? 's' : ''}</span>
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
      </main>

      {/* Create map modal */}
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
    <div className="group relative flex flex-col rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:border-stone-300 hover:shadow-md">
      {/* Map icon + name */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100">
            <Map className="h-4 w-4 text-stone-500" />
          </div>
          <h3 className="font-semibold leading-snug text-stone-900 line-clamp-2">{map.name}</h3>
        </div>

        {/* Delete button — visible on hover */}
        {!confirmDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="shrink-0 rounded-lg p-1.5 text-stone-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
            title="Delete map"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Delete confirmation inline */}
      {confirmDelete && (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
          <p className="text-xs font-medium text-red-700">Delete this map?</p>
          <p className="mt-0.5 text-xs text-red-500">Books and highlights are not affected.</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-lg border border-stone-200 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      {!confirmDelete && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            {nodeCount} book{nodeCount !== 1 ? 's' : ''} · {createdDate}
          </span>
          <button
            onClick={onOpen}
            className="flex items-center gap-1 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200"
          >
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-stone-900">New map</h2>
        <p className="mt-1 text-sm text-stone-500">
          Give your map a name. You can always rename it later.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Philosophy reading list"
            className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40"
            >
              Create map
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
