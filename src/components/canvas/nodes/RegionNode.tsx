import { memo, useState } from 'react';
import { Handle, Position, NodeResizer, type NodeProps, type ResizeParams } from '@xyflow/react';
import { updateCanvasNodeContent, updateCanvasNodeSize } from '../../../db/canvasRepository';

export type RegionNodeData = {
  nodeId: string;
  content: string;
  locked?: boolean;
  style?: { background?: string; border?: string; text?: string };
};

/**
 * A visual region / folder: a soft, tinted backdrop that groups related nodes
 * on the desk. Purely visual in Sprint 4 — it doesn't capture or move the nodes
 * inside it (that's deferred). Sits behind everything (see layerOrder), resizes
 * like a shape, and carries an optional title. Pin it so it doesn't drift when
 * you rearrange the nodes on top of it.
 */
function RegionNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as RegionNodeData;
  const style = d.style;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(d.content);

  const startEditing = () => setEditing(true);

  const handleSave = async () => {
    setEditing(false);
    await updateCanvasNodeContent(id, title.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { handleSave(); }
    if (e.key === 'Escape') { setEditing(false); setTitle(d.content); }
  };

  const handleResizeEnd = (_: unknown, params: ResizeParams) => {
    updateCanvasNodeSize(id, params.width, params.height);
  };

  return (
    <div
      onDoubleClick={startEditing}
      className={[
        'km-region h-full w-full',
        selected ? 'km-region--selected' : '',
        editing ? 'cursor-text' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
      style={{
        background: style?.background,
        borderColor: !selected ? style?.border : undefined,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={100}
        onResizeEnd={handleResizeEnd}
        lineClassName="!border-[#3D6B8E]"
        handleClassName="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[#3D6B8E] !bg-white"
      />
      <Handle type="source" id="top"    position={Position.Top} />
      <Handle type="source" id="right"  position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
      <Handle type="source" id="left"   position={Position.Left} />

      <div className="km-region__title">
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Region name…"
            className="nodrag nopan w-full bg-transparent outline-none"
            style={{ color: style?.text }}
          />
        ) : (
          <span className={title ? '' : 'italic opacity-60'} style={{ color: style?.text }}>
            {title || 'Region'}
          </span>
        )}
      </div>
    </div>
  );
}

export const RegionNode = memo(RegionNodeComponent);
