import { useState } from 'react';
import { Sparkles } from 'lucide-react';

type Props = {
  onRemove: () => Promise<void> | void;
};

/** Slim banner shown while the example dataset is loaded, so it's never mistaken
 * for the user's own library and can be removed in one click. */
export function SampleDataBanner({ onRemove }: Props) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center gap-3 px-4 py-2 text-sm"
      style={{ background: 'var(--accent-soft)', color: 'var(--text-2)', borderBottom: '1px solid var(--accent-border)' }}
    >
      <Sparkles className="h-4 w-4 flex-none" style={{ color: 'var(--accent)' }} />
      <span>You’re exploring <b style={{ color: 'var(--text)' }}>example data</b>.</span>
      <button
        onClick={handleRemove}
        disabled={removing}
        className="km-btn km-btn--ghost km-btn--sm"
        style={{ color: 'var(--accent)' }}
      >
        {removing ? 'Removing…' : 'Remove sample data'}
      </button>
    </div>
  );
}
