import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';

export type LabeledEdgeData = {
  label?: string;
  onEdit?: (id: string) => void;
};

function LabeledEdgeComponent({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  style,
  markerEnd,
  markerStart,
  selected,
  data,
}: EdgeProps) {
  const d = data as LabeledEdgeData | undefined;
  const label = d?.label ?? '';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} markerStart={markerStart} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onDoubleClick={() => d?.onEdit?.(id)}
        >
          {label ? (
            <span
              className={[
                'inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium',
                'bg-white text-stone-700 shadow-sm',
                selected ? 'border-amber-400' : 'border-stone-200',
              ].join(' ')}
            >
              {label}
            </span>
          ) : selected ? (
            <span className="inline-block rounded-full border border-dashed border-stone-300 px-2.5 py-0.5 text-[10px] text-stone-400 bg-white/80">
              doble click para etiquetar
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const LabeledEdge = memo(LabeledEdgeComponent);
