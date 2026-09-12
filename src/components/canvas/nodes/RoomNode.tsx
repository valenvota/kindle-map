import { memo, useState, useEffect } from 'react';
import { type NodeProps } from '@xyflow/react';
import { DoorOpen, Star, ArrowRight } from 'lucide-react';
import { renameRoom } from '../../../db/mapsRepository';
import { consumeRoomNameEdit, subscribeRoomNameEdit } from './roomNameAutoEdit';

export type RoomNodeData = {
  nodeId: string;
  /** The child map this Room card references (its contents live there). */
  roomId: string;
  /** Live child-map name (`maps.name`, the single source of truth). */
  name: string;
  /** Live count of nodes inside the child map — a minimal content preview. */
  itemCount: number;
};

/**
 * A Room on the Locus: a framed "place" card that references a child map. Styled
 * to the Locus mockup — warm paper, serif name, a stacked-paper edge, an accent
 * selection ring + soft glow (see `.km-roomnode` in index.css). Double-clicking it
 * enters the child map (handled in ReadingCanvas). No edge handles — Rooms aren't
 * connected in L1.
 *
 * Inline naming (L2.1): a freshly created card mounts straight into a rename input
 * (via `consumeRoomNameEdit`); Enter/blur commits to `maps.name` through
 * `renameRoom`, empty keeps the default 'Untitled Room', Escape discards the edit.
 * This is the only rename path in Slice A; existing-Room rename (context menu)
 * lands in Slice B. The star and enter-hint are decorative only.
 */
function RoomNodeComponent({ data, selected }: NodeProps) {
  const d = data as RoomNodeData;
  const count = d.itemCount;

  // A freshly created card mounts already in rename mode (see roomNameAutoEdit).
  const [editing, setEditing] = useState(() => consumeRoomNameEdit(d.nodeId));
  const [text, setText] = useState('');

  // An already-mounted card (Slice B: context-menu Renombrar) can't re-run the
  // mount-time consume, so it listens for a rename request aimed at its own id.
  // setState lives in the subscription callback, not the effect body.
  useEffect(
    () => subscribeRoomNameEdit((id) => {
      if (id === d.nodeId && consumeRoomNameEdit(d.nodeId)) {
        setText('');
        setEditing(true);
      }
    }),
    [d.nodeId],
  );

  const commit = async () => {
    setEditing(false);
    const next = text.trim();
    // Empty keeps the current name (defaults to 'Untitled Room'); no rollback.
    if (next && next !== d.name) await renameRoom(d.roomId, next);
  };

  const cancel = () => setEditing(false);

  return (
    <div
      className={`km-roomnode${selected ? ' km-roomnode--selected' : ''}`}
      title={d.name || 'Room'}
    >
      <div className="km-roomnode__card">
        <div className="km-roomnode__head">
          <span className="km-roomnode__icon">
            <DoorOpen />
          </span>
          {editing ? (
            <input
              autoFocus
              value={text}
              placeholder="Name this Room…"
              onChange={(e) => setText(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); void commit(); }
                else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              className="font-display nodrag nopan min-w-0 flex-1 truncate border-none bg-transparent p-0 text-[17px] font-medium text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
            />
          ) : (
            <span className="km-roomnode__name">{d.name || 'Room'}</span>
          )}
          <span className="km-roomnode__star" aria-hidden="true">
            <Star />
          </span>
        </div>
        <div className="km-roomnode__body">
          <span className="km-roomnode__count">
            {count} item{count !== 1 ? 's' : ''}
          </span>
          <span className="km-roomnode__enter">
            Double click to enter <ArrowRight />
          </span>
        </div>
      </div>
    </div>
  );
}

export const RoomNode = memo(RoomNodeComponent);
