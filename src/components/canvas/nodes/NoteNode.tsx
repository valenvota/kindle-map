import { memo, useState } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';
import { updateCanvasNodeContent } from '../../../db/canvasRepository';
import { useCanvasTool } from '../CanvasToolContext';

export type NoteNodeData = {
  nodeId: string;
  content: string;
  style?: { background?: string; border?: string; text?: string };
};

function NoteNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as NoteNodeData;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(d.content);
  const { activeTool, arrowSourceId, onArrowNodeClick } = useCanvasTool();
  const arrowMode = activeTool === 'arrow';
  const isArrowSource = arrowSourceId === id;

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
      onClick={arrowMode ? (e) => { e.stopPropagation(); console.log('[arrow] NoteNode onClick', id); onArrowNodeClick(id); } : undefined}
      onDoubleClick={startEditing}
      className={[
        'w-52 rounded-2xl border shadow-md transition-shadow select-none',
        isArrowSource
          ? 'border-amber-500 shadow-lg ring-4 ring-amber-300'
          : selected
            ? 'border-yellow-400 shadow-lg ring-2 ring-yellow-200'
            : style?.border
              ? 'hover:shadow-lg'
              : 'border-yellow-300 hover:border-yellow-400 hover:shadow-lg',
        editing ? 'cursor-text' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
      style={{
        backgroundColor: style?.background ?? '#fefce8', // warm yellow, not harsh
        borderColor: !selected ? style?.border : undefined,
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-t-2xl border-b border-yellow-200 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600">Note</span>
        {editing && (
          <button
            onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
            className="nodrag nopan rounded px-2 py-0.5 text-[10px] font-semibold text-yellow-700 hover:bg-yellow-200"
          >
            Save
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {editing ? (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Write your note…"
            rows={4}
            className="nodrag nopan w-full resize-none bg-transparent text-sm outline-none placeholder:text-stone-400"
            style={{ color: style?.text }}
          />
        ) : (
          <p
            className={[
              'min-h-[60px] whitespace-pre-wrap text-sm leading-relaxed',
              text ? (style?.text ? '' : 'text-stone-800') : 'italic text-stone-400',
            ].join(' ')}
            style={{ color: text ? style?.text : undefined }}
          >
            {text || 'Double-click to add a note'}
          </p>
        )}
      </div>
    </div>
    </>
  );
}

export const NoteNode = memo(NoteNodeComponent);
