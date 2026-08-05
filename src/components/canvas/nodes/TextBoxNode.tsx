import { memo, useState } from 'react';
import { Handle, Position, NodeResizer, type NodeProps, type ResizeParams } from '@xyflow/react';
import { updateCanvasNodeContent, updateCanvasNodeSize, deleteCanvasNode } from '../../../db/canvasRepository';
import { consumeTextEdit } from './textAutoEdit';

export type TextBoxNodeData = {
  nodeId: string;
  content: string;
  style?: { background?: string; border?: string; text?: string };
};

/**
 * A free-text box: a light label, title, or annotation written straight onto
 * the map. Transparent by default (no paper chrome) — that's what sets it apart
 * from NoteNode, which is a paper note for a longer thought. Resizable like a
 * shape; created straight into edit mode; removed if left empty.
 */
function TextBoxNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as TextBoxNodeData;
  const style = d.style;
  // Freshly created boxes mount already focused (see textAutoEdit).
  const [editing, setEditing] = useState(() => consumeTextEdit(id));
  const [text, setText] = useState(d.content);

  const startEditing = () => setEditing(true);

  const handleSave = async () => {
    setEditing(false);
    const trimmed = text.trim();
    // An empty text box has nothing to show and can't be re-selected once
    // deselected — drop it instead of leaving an invisible node behind.
    if (!trimmed) {
      await deleteCanvasNode(id);
      return;
    }
    await updateCanvasNodeContent(id, trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter saves; Escape cancels (and drops a never-filled box).
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { handleSave(); }
    if (e.key === 'Escape') {
      if (!d.content.trim()) { deleteCanvasNode(id); return; }
      setEditing(false);
      setText(d.content);
    }
  };

  const handleResizeEnd = (_: unknown, params: ResizeParams) => {
    updateCanvasNodeSize(id, params.width, params.height);
  };

  return (
    <div
      onDoubleClick={startEditing}
      className={[
        'km-textbox h-full w-full',
        selected ? 'km-textbox--selected' : '',
        editing ? 'cursor-text' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
      style={{
        background: style?.background,
        border: style?.border ? `1px solid ${style.border}` : undefined,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={30}
        onResizeEnd={handleResizeEnd}
        lineClassName="!border-[#3D6B8E]"
        handleClassName="!h-2.5 !w-2.5 !rounded-full !border-2 !border-[#3D6B8E] !bg-white"
      />
      <Handle type="source" id="top"    position={Position.Top} />
      <Handle type="source" id="right"  position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
      <Handle type="source" id="left"   position={Position.Left} />

      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder="Type text…"
          className="nodrag nopan h-full w-full resize-none bg-transparent outline-none placeholder:text-[var(--ink-faint)]"
          style={{ color: style?.text }}
        />
      ) : (
        <p
          className={[
            'h-full w-full overflow-hidden whitespace-pre-wrap',
            text ? (style?.text ? '' : 'text-[var(--ink)]') : 'italic text-[var(--ink-faint)]',
          ].join(' ')}
          style={{ color: text ? style?.text : undefined }}
        >
          {text || 'Double-click to edit'}
        </p>
      )}
    </div>
  );
}

export const TextBoxNode = memo(TextBoxNodeComponent);
