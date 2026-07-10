import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps, type ResizeParams } from '@xyflow/react';
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
    <div
      className={[
        'h-full w-full cursor-grab border-2 active:cursor-grabbing',
        d.shapeKind === 'circle' ? 'rounded-full' : 'rounded-lg',
        selected
          ? 'border-[#3D6B8E] ring-2 ring-[#3D6B8E]/30'
          : 'border-stone-400',
      ].join(' ')}
      style={{
        backgroundColor: style?.background ?? 'rgba(120, 113, 108, 0.08)',
        borderColor: !selected ? style?.border : undefined,
      }}
    >
      <Handle type="source" id="top"    position={Position.Top} />
      <Handle type="source" id="right"  position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
      <Handle type="source" id="left"   position={Position.Left} />
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={60}
        onResizeEnd={handleResizeEnd}
        lineClassName="!border-[#3D6B8E]"
        handleClassName="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[#3D6B8E] !bg-white"
      />
    </div>
  );
}

export const ShapeNode = memo(ShapeNodeComponent);
