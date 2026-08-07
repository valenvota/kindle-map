import { useState } from 'react';
import { Highlighter, Network, Lock, Upload, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

type Props = {
  onImport: () => void;
  onExplore: () => Promise<void> | void;
};

const VALUE_PROPS = [
  { icon: Highlighter, title: 'Bring in your highlights', body: 'Import your Kindle clippings and every book becomes a living page of quotes and notes.' },
  { icon: Network, title: 'Map how ideas connect', body: 'Drag books, quotes, and notes onto a canvas and draw the links between them.' },
  { icon: Lock, title: 'Stays on your device', body: 'No account, no uploads. Everything lives in your browser.' },
];

export function WelcomeScreen({ onImport, onExplore }: Props) {
  const [exploring, setExploring] = useState(false);

  const handleExplore = async () => {
    setExploring(true);
    try {
      await onExplore();
    } finally {
      setExploring(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        {/* Logo / wordmark */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--brand)' }}>
              <span className="text-lg font-bold text-white">K</span>
            </div>
            <span className="text-xl font-semibold" style={{ color: 'var(--text)' }}>KindleMap</span>
          </div>
          <h1 className="mt-5 font-display text-3xl font-light leading-tight tracking-tight" style={{ color: 'var(--text)' }}>
            A visual map of your reading mind.
          </h1>
        </div>

        {/* Value props */}
        <div className="mb-8 flex flex-col gap-3">
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border-md)', background: 'var(--surface)' }}>
              <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl" style={{ background: 'var(--brand-soft)' }}>
                <Icon className="h-5 w-5" style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</p>
                <p className="mt-0.5 text-sm font-light" style={{ color: 'var(--text-2)' }}>{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Button variant="primary" size="lg" className="flex-1" onClick={onImport} disabled={exploring}>
            <Upload className="h-4 w-4" /> Import your highlights
          </Button>
          <Button variant="secondary" size="lg" className="flex-1" onClick={handleExplore} disabled={exploring}>
            <Sparkles className="h-4 w-4" /> {exploring ? 'Loading…' : 'Explore with example'}
          </Button>
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: 'var(--text-3)' }}>
          No account needed. Everything stays on your device.
        </p>
      </div>
    </div>
  );
}
