import { RotateCcw } from 'lucide-react';
import { updateCanvasNodeStyle } from '../../db/canvasRepository';
import type { CanvasNodeData } from '../../types/canvas';

const COLORS = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ef4444', // red
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#78716c', // stone
  '#1c1917', // near-black
];

type StyleKey = 'background' | 'border' | 'text';

type Props = {
  nodeId: string;
  style?: CanvasNodeData['style'];
};

export function NodeStyleToolbar({ nodeId, style }: Props) {
  const setColor = async (key: StyleKey, color: string) => {
    await updateCanvasNodeStyle(nodeId, { ...style, [key]: color });
  };

  const reset = async () => {
    await updateCanvasNodeStyle(nodeId, undefined);
  };

  const hasOverrides = !!(style?.background || style?.border || style?.text);

  return (
    <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 shadow-xl">
      <ColorGroup label="Fill" current={style?.background} onPick={(c) => setColor('background', c)} />
      <div className="h-8 w-px bg-stone-200" />
      <ColorGroup label="Border" current={style?.border} onPick={(c) => setColor('border', c)} />
      <div className="h-8 w-px bg-stone-200" />
      <ColorGroup label="Text" current={style?.text} onPick={(c) => setColor('text', c)} />

      {hasOverrides && (
        <>
          <div className="h-8 w-px bg-stone-200" />
          <button
            onClick={reset}
            title="Reset to default style"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </>
      )}
    </div>
  );
}

function ColorGroup({
  label,
  current,
  onPick,
}: {
  label: string;
  current?: string;
  onPick: (color: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</span>
      <div className="flex items-center gap-1">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onPick(c)}
            title={c}
            className={[
              'h-5 w-5 rounded-full transition-transform hover:scale-110',
              current === c ? 'ring-2 ring-stone-400 ring-offset-1' : '',
            ].join(' ')}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}
