import { memo } from 'react';
import { NodeResizer, Handle, Position, type NodeProps, type ResizeParams } from '@xyflow/react';
import type { ShapeKind } from '../../../types/canvas';
import { updateCanvasNodeSize } from '../../../db/canvasRepository';
import { useCanvasTool } from '../CanvasToolContext';

export type ShapeNodeData = {
  nodeId: string;
  shapeKind: ShapeKind;
  style?: { background?: string; border?: string; text?: string };
};

function ShapeNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as ShapeNodeData;
  const style = d.style;

  const { activeTool, arrowSourceId, onArrowNodeClick } = useCanvasTool();
  const arrowMode = activeTool === 'arrow';
  const isArrowSource = arrowSourceId === id;

  const handleResizeEnd = (_: unknown, params: ResizeParams) => {
    updateCanvasNodeSize(id, params.width, params.height);
  };

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={60}
        onResizeEnd={handleResizeEnd}
        lineClassName="!border-amber-400"
        handleClassName="!h-2.5 !w-2.5 !rounded-full !border-2 !border-amber-400 !bg-white"
      />
      {arrowMode && (
        <>
          <Handle id="top"    type="source" position={Position.Top}    className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
          <Handle id="bottom" type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
          <Handle id="left"   type="source" position={Position.Left}   className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
          <Handle id="right"  type="source" position={Position.Right}  className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
        </>
      )}
      <div
        onClick={arrowMode ? (e) => { e.stopPropagation(); console.log('[arrow] ShapeNode onClick', id); onArrowNodeClick(id); } : undefined}
        className={[
          'h-full w-full cursor-grab border-2 active:cursor-grabbing',
          d.shapeKind === 'circle' ? 'rounded-full' : 'rounded-lg',
          isArrowSource
          ? 'border-amber-500 ring-4 ring-amber-300'
          : selected
            ? 'border-amber-500 ring-2 ring-amber-200'
            : 'border-stone-400',
        ].join(' ')}
        style={{
          backgroundColor: style?.background ?? 'rgba(120, 113, 108, 0.08)',
          borderColor: !selected ? style?.border : undefined,
        }}
      />
    </>
  );
}

export const ShapeNode = memo(ShapeNodeComponent);
