import { memo, useState, useRef } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';
import { updateCanvasNodeContent } from '../../../db/canvasRepository';
import { useCanvasTool } from '../CanvasToolContext';

export type TopicNodeData = {
  nodeId: string;
  content: string;
  style?: { background?: string; border?: string; text?: string };
};

function TopicNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as TopicNodeData;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(d.content);
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeTool } = useCanvasTool();
  const arrowMode = activeTool === 'arrow';

  const startEditing = () => {
    setEditing(true);
    // Let the input mount before selecting
    setTimeout(() => inputRef.current?.select(), 30);
  };

  const handleSave = async () => {
    setEditing(false);
    const trimmed = text.trim();
    await updateCanvasNodeContent(id, trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { setEditing(false); setText(d.content); }
  };

  const style = d.style;

  return (
    <>
    {arrowMode && (
      <>
        <Handle id="top"    type="source" position={Position.Top}    className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
        <Handle id="bottom" type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
        <Handle id="left"   type="source" position={Position.Left}   className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
        <Handle id="right"  type="source" position={Position.Right}  className="!h-3 !w-3 !border-2 !border-amber-400 !bg-white" />
      </>
    )}
    <div
      onDoubleClick={startEditing}
      className={[
        'flex min-h-[44px] min-w-[140px] max-w-[260px] items-center justify-center rounded-2xl border-2',
        'px-4 py-2.5 shadow-md transition-shadow select-none',
        selected
          ? 'border-amber-500 shadow-lg ring-2 ring-amber-200'
          : style?.border
            ? 'hover:shadow-lg'
            : 'border-amber-400 bg-white hover:border-amber-500 hover:shadow-lg',
        editing ? 'cursor-text' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
      style={{
        backgroundColor: style?.background,
        borderColor: !selected ? style?.border : undefined,
      }}
    >
      {editing ? (
        <input
          ref={inputRef}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder="Topic label…"
          className="nodrag nopan w-full bg-transparent text-center text-sm font-semibold outline-none placeholder:text-stone-300"
          style={{ minWidth: 80, color: style?.text }}
        />
      ) : (
        <span
          className={[
            'text-center text-sm font-semibold',
            text ? (style?.text ? '' : 'text-stone-900') : 'italic text-stone-400',
          ].join(' ')}
          style={{ color: text ? style?.text : undefined }}
        >
          {text || 'Double-click to edit'}
        </span>
      )}
    </div>
    </>
  );
}

export const TopicNode = memo(TopicNodeComponent);
