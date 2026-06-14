import { memo } from 'react';
import { NodeResizer, Handle, Position, type NodeProps, type ResizeParams } from '@xyflow/react';
import type { ShapeKind } from '../../../types/canvas';
import { updateCanvasNodeSize } from '../../../db/canvasRepository';

export type ShapeNodeData = {
  nodeId: string;
  shapeKind: ShapeKind;
  style?: { background?: string; border?: string; text?: string };
};

function ShapeNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as ShapeNodeData;
  const style = d.style;

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
      <Handle type="source" position={Position.Top} className="!h-2 !w-2 !border-2 !border-amber-400 !bg-white" />
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-2 !border-amber-400 !bg-white" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-2 !border-amber-400 !bg-white" />
      <Handle type="target" position={Position.Bottom} className="!h-2 !w-2 !border-2 !border-amber-400 !bg-white" />
      <Handle type="source" position={Position.Left} className="!h-2 !w-2 !border-2 !border-amber-400 !bg-white" />
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-2 !border-amber-400 !bg-white" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-2 !border-amber-400 !bg-white" />
      <Handle type="target" position={Position.Right} className="!h-2 !w-2 !border-2 !border-amber-400 !bg-white" />
      <div
        className={[
          'h-full w-full cursor-grab border-2 active:cursor-grabbing',
          d.shapeKind === 'circle' ? 'rounded-full' : 'rounded-lg',
          selected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-stone-400',
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
