import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { DoorOpen } from 'lucide-react';

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
 * A Room on the Locus: a foreground card that references a child map. Distinct
 * from RegionNode (a passive tinted backdrop) — this is an openable container.
 * Double-clicking it enters the child map (handled in ReadingCanvas). No edge
 * handles: Rooms aren't connected in L1. Visual polish is deferred to L2/3.5;
 * this is the minimal card (name + item count + enter hint).
 */
function RoomNodeComponent({ data, selected }: NodeProps) {
  const d = data as RoomNodeData;
  return (
    <div
      className={[
        'flex w-[240px] flex-col rounded-2xl border-2 bg-white px-4 py-3 shadow-md transition-shadow select-none',
        'cursor-grab active:cursor-grabbing',
        selected
          ? 'border-[#3D6B8E] shadow-lg ring-2 ring-[#3D6B8E]/30'
          : 'border-[#3D6B8E]/50 hover:border-[#3D6B8E] hover:shadow-lg',
      ].join(' ')}
      title={d.name || 'Room'}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'rgba(61,107,142,0.10)' }}
        >
          <DoorOpen className="h-4 w-4" style={{ color: '#3D6B8E' }} />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ink)]">
          {d.name || 'Room'}
        </span>
      </div>
      <span className="mt-2 text-xs text-[var(--ink-faint)]">
        {d.itemCount} item{d.itemCount !== 1 ? 's' : ''}
      </span>
      <p className="mt-1 text-[11px] italic text-[var(--ink-faint)]">double-click to enter</p>
    </div>
  );
}

export const RoomNode = memo(RoomNodeComponent);
