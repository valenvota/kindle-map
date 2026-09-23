import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, DoorOpen } from 'lucide-react';
import { Modal } from '../ui';
import { getAllMaps } from '../../db/mapsRepository';
import { sendHighlightsToRoom, type SendToRoomResult } from '../../db/sendToRoom';
import type { Highlight } from '../../types/highlight';
import type { KindleMap } from '../../types/map';

type Props = {
  bookId: string;
  /** The highlights to send (already the user's selection). */
  highlights: Highlight[];
  onClose: () => void;
  onSent: (result: SendToRoomResult, roomName: string) => void;
};

/**
 * L3 Slice 1 — pick an existing Room to send the selected highlights into. Rooms
 * only (the root Locus is excluded on purpose: material should enter a context,
 * not accumulate loose at the root). No "+ New Room" here — if there are no Rooms
 * yet, a restrained empty state points the user to create one first.
 */
export function SendToRoomModal({ bookId, highlights, onClose, onSent }: Props) {
  const maps = useLiveQuery(() => getAllMaps(), []);
  const [query, setQuery] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Ancestry path label for disambiguation, derived in-memory from the one maps
  // query (no per-row ancestry calls). Rooms = every non-root map.
  const { rooms, pathById } = useMemo(() => {
    const all = maps ?? [];
    const byId = new Map(all.map((m) => [m.id, m]));
    const pathById = new Map<string, string>();
    const ancestorsOf = (m: KindleMap): string[] => {
      const names: string[] = [];
      let cur = m.parentId ? byId.get(m.parentId) : undefined;
      const seen = new Set<string>([m.id]);
      while (cur && !seen.has(cur.id)) {
        seen.add(cur.id);
        names.unshift(cur.name);
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
      return names;
    };
    const rooms = all.filter((m) => !m.isRoot);
    for (const r of rooms) pathById.set(r.id, ancestorsOf(r).join(' / '));
    return { rooms, pathById };
  }, [maps]);

  const filtered = rooms.filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return r.name.toLowerCase().includes(q) || (pathById.get(r.id) ?? '').toLowerCase().includes(q);
  });

  const handlePick = async (room: KindleMap) => {
    if (sendingId) return;
    setSendingId(room.id);
    try {
      const result = await sendHighlightsToRoom(room.id, bookId, highlights);
      onSent(result, room.name);
      onClose();
    } finally {
      setSendingId(null);
    }
  };

  const count = highlights.length;

  return (
    <Modal title={`Send ${count} highlight${count !== 1 ? 's' : ''} to Room`} onClose={onClose} maxWidth={460}>
      {maps === undefined ? (
        <p className="str-empty">Loading Rooms…</p>
      ) : rooms.length === 0 ? (
        <p className="str-empty">Create a Room before sending highlights.</p>
      ) : (
        <>
          <div className="str-search">
            <Search />
            <input
              autoFocus
              placeholder="Search Rooms…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="km-field"
            />
          </div>
          <div className="str-list">
            {filtered.length === 0 ? (
              <p className="str-empty">No Rooms match “{query}”.</p>
            ) : (
              filtered.map((room) => {
                const path = pathById.get(room.id);
                return (
                  <button
                    key={room.id}
                    className="str-row"
                    onClick={() => handlePick(room)}
                    disabled={!!sendingId}
                  >
                    <DoorOpen className="str-row__icon" />
                    <span className="str-row__text">
                      <span className="str-row__name">{room.name}</span>
                      {path && <span className="str-row__path">{path}</span>}
                    </span>
                    <span className="str-row__cta">{sendingId === room.id ? 'Sending…' : 'Send'}</span>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
