import { useState } from 'react';
import { Sparkles, ChevronLeft } from 'lucide-react';

type Props = {
  onBackToWelcome: () => void;
  onRemove: () => Promise<void> | void;
};

/** Slim banner shown while the example dataset is loaded, so it's never mistaken
 * for the user's own library. Offers a way back to the welcome screen and a
 * one-click removal — neither of which traps the user. */
export function SampleDataBanner({ onBackToWelcome, onRemove }: Props) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try { await onRemove(); } finally { setRemoving(false); }
  };

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-sm"
      style={{ background: 'var(--accent-soft)', color: 'var(--text-2)', borderBottom: '1px solid var(--accent-border)' }}
    >
      <button onClick={onBackToWelcome} className="km-btn km-btn--ghost km-btn--sm" style={{ color: 'var(--accent)' }}>
        <ChevronLeft className="h-4 w-4" /> Back to welcome
      </button>
      <span className="inline-flex items-center gap-1.5">
        <Sparkles className="h-4 w-4" style={{ color: 'var(--accent)' }} />
        You're exploring <b style={{ color: 'var(--text)' }}>example data</b>.
      </span>
      <button onClick={handleRemove} disabled={removing} className="km-btn km-btn--ghost km-btn--sm" style={{ color: 'var(--accent)' }}>
        {removing ? 'Removing…' : 'Remove sample data'}
      </button>
    </div>
  );
}
