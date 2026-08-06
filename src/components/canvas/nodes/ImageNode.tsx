import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps, type ResizeParams } from '@xyflow/react';
import { ImageOff } from 'lucide-react';
import { updateCanvasNodeSize } from '../../../db/canvasRepository';

export type ImageNodeData = {
  nodeId: string;
  /** The (downscaled) image data URI. */
  src: string;
  locked?: boolean;
};

/**
 * A photo / image dropped on the desk (Sprint 4). The pixels live inline as a
 * data URI (see downscaleImage). Resizes with the aspect ratio locked so the
 * picture never distorts; pin it so it stays put behind your notes.
 */
function ImageNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as ImageNodeData;

  const handleResizeEnd = (_: unknown, params: ResizeParams) => {
    updateCanvasNodeSize(id, params.width, params.height);
  };

  return (
    <div
      className={[
        'km-imagenode h-full w-full',
        selected ? 'km-imagenode--selected' : '',
        'cursor-grab active:cursor-grabbing',
      ].join(' ')}
    >
      <NodeResizer
        isVisible={selected}
        keepAspectRatio
        minWidth={80}
        minHeight={80}
        onResizeEnd={handleResizeEnd}
        lineClassName="!border-[#3D6B8E]"
        handleClassName="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[#3D6B8E] !bg-white"
      />
      <Handle type="source" id="top"    position={Position.Top} />
      <Handle type="source" id="right"  position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
      <Handle type="source" id="left"   position={Position.Left} />

      {d.src ? (
        <img src={d.src} alt="" draggable={false} />
      ) : (
        <div className="flex h-full w-full items-center justify-center" style={{ color: 'var(--ink-faint)' }}>
          <ImageOff className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}

export const ImageNode = memo(ImageNodeComponent);
