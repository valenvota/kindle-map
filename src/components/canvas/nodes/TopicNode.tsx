import { memo, useState, useRef } from 'react';
import { type NodeProps } from '@xyflow/react';
import { updateCanvasNodeContent } from '../../../db/canvasRepository';

export type TopicNodeData = {
  nodeId: string;
  content: string;
};

function TopicNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as TopicNodeData;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(d.content);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div
      onDoubleClick={startEditing}
      className={[
        'flex min-w-[140px] max-w-[260px] items-center justify-center rounded-2xl border-2',
        'px-4 py-2.5 shadow-md transition-shadow select-none',
        selected
          ? 'border-amber-500 shadow-lg ring-2 ring-amber-200'
          : 'border-amber-400 bg-white hover:border-amber-500 hover:shadow-lg',
        editing ? 'cursor-text' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
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
          className="nodrag nopan w-full bg-transparent text-center text-sm font-semibold text-stone-900 outline-none placeholder:text-stone-300"
          style={{ minWidth: 80 }}
        />
      ) : (
        <span
          className={[
            'text-center text-sm font-semibold',
            text ? 'text-stone-900' : 'italic text-stone-400',
          ].join(' ')}
        >
          {text || 'Double-click to edit'}
        </span>
      )}
    </div>
  );
}

export const TopicNode = memo(TopicNodeComponent);
