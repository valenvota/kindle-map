import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { DoorOpen, Star, ArrowRight } from 'lucide-react';

export type RoomNodeData = {
  nodeId: string;
  /** The child map this Room card references (its contents live there). */
  roomId: string;
  /** Denormalized Room name. */
  name: string;
  /** Live count of nodes inside the child map — a minimal content preview. */
  itemCount: number;
};

/**
 * A Room on the Locus: a framed "place" card that references a child map. Styled
 * to the Locus mockup — warm paper, serif name, a stacked-paper edge that reads
 * as a container, an accent selection ring + soft glow (see `.km-roomnode` in
 * index.css). Distinct from RegionNode (a passive tinted backdrop): this is an
 * openable container. Double-clicking it enters the child map (handled in
 * ReadingCanvas). No edge handles — Rooms aren't connected in L1. The star and
 * enter-hint are decorative only; this stays a visual pass (no CRUD, no live
 * preview, no new behavior or data — those belong to L2).
 */
function RoomNodeComponent({ data, selected }: NodeProps) {
  const d = data as RoomNodeData;
  const count = d.itemCount;
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
          <span className="km-roomnode__name">{d.name || 'Room'}</span>
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
