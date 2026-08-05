import { memo, useState } from 'react';
import { Handle, Position, NodeResizer, type NodeProps, type ResizeParams } from '@xyflow/react';
import { updateCanvasNodeContent, updateCanvasNodeSize } from '../../../db/canvasRepository';

export type NoteNodeData = {
  nodeId: string;
  content: string;
  style?: { background?: string; border?: string; text?: string };
};

function NoteNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as NoteNodeData;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(d.content);

  const startEditing = () => setEditing(true);

  const handleSave = async () => {
    setEditing(false);
    await updateCanvasNodeContent(id, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd+Enter to save; Escape to cancel
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { handleSave(); }
    if (e.key === 'Escape') { setEditing(false); setText(d.content); }
  };

  const handleResizeEnd = (_: unknown, params: ResizeParams) => {
    updateCanvasNodeSize(id, params.width, params.height);
  };

  const style = d.style;

  return (
    <div
      onDoubleClick={startEditing}
      className={[
        'flex h-full w-full flex-col rounded-2xl border shadow-md transition-shadow select-none',
        selected
          ? 'border-[#3D6B8E] shadow-lg ring-2 ring-[#3D6B8E]/30'
          : style?.border
            ? 'hover:shadow-lg'
            : 'border-[#C4894A]/40 hover:border-[#C4894A]/70 hover:shadow-lg',
        editing ? 'cursor-text' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
      style={{
        backgroundColor: style?.background ?? '#F7F4EE',
        borderColor: !selected ? style?.border : undefined,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={90}
        onResizeEnd={handleResizeEnd}
        lineClassName="!border-[#3D6B8E]"
        handleClassName="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[#3D6B8E] !bg-white"
      />
      <Handle type="source" id="top"    position={Position.Top} />
      <Handle type="source" id="right"  position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
      <Handle type="source" id="left"   position={Position.Left} />
      {/* Header bar */}
      <div className="flex flex-none items-center justify-between rounded-t-2xl border-b border-[#C4894A]/20 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4894A]">Note</span>
        {editing && (
          <button
            onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
            className="nodrag nopan rounded px-2 py-0.5 text-[10px] font-semibold text-[#a96f35] hover:bg-[#C4894A]/15"
          >
            Save
          </button>
        )}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {editing ? (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Write your note…"
            className="nodrag nopan h-full w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--ink-faint)]"
            style={{ color: style?.text }}
          />
        ) : (
          <p
            className={[
              'whitespace-pre-wrap text-sm leading-relaxed',
              text ? (style?.text ? '' : 'text-[var(--ink-soft)]') : 'italic text-[var(--ink-faint)]',
            ].join(' ')}
            style={{ color: text ? style?.text : undefined }}
          >
            {text || 'Double-click to add a note'}
          </p>
        )}
      </div>
    </div>
  );
}

export const NoteNode = memo(NoteNodeComponent);
