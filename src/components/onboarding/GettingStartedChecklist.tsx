import { Check, X } from 'lucide-react';

export type ChecklistStep = { label: string; done: boolean };

type Props = {
  steps: ChecklistStep[];
  onDismiss: () => void;
};

/**
 * A calm, optional "getting started" card (Onboarding v1). Non-blocking, lives
 * in the corner, fully dismissible. The parent decides when to render it (hidden
 * once dismissed or once every step is done).
 */
export function GettingStartedChecklist({ steps, onDismiss }: Props) {
  const done = steps.filter((s) => s.done).length;

  return (
    <div
      className="fixed bottom-5 right-5 z-30 w-72 rounded-2xl border p-4 shadow-lg"
      style={{ borderColor: 'var(--border-md)', background: 'var(--surface)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Getting started</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{done} of {steps.length} done</p>
        </div>
        <button onClick={onDismiss} aria-label="Dismiss" className="km-iconbtn" style={{ height: 28, width: 28 }}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span
              className="flex h-5 w-5 flex-none items-center justify-center rounded-full border"
              style={s.done
                ? { background: 'var(--accent)', borderColor: 'var(--accent)' }
                : { borderColor: 'var(--border-strong)' }}
            >
              {s.done && <Check className="h-3 w-3 text-white" />}
            </span>
            <span style={{ color: s.done ? 'var(--text-3)' : 'var(--text)', textDecoration: s.done ? 'line-through' : 'none' }}>
              {s.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
