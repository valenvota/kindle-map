import { Home } from 'lucide-react';

/**
 * Desk — the return surface, reachable from the primary nav. This is a Slice 3
 * placeholder only: navigation/shell support exists, but the real Desk (recent
 * highlights / notes / Rooms + Continue in Locus) is built in Slice 4. Library
 * stays the default landing until then, so this stub is only shown on demand.
 */
export function DeskPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'var(--brand-soft)' }}
      >
        <Home className="h-8 w-8" style={{ color: 'var(--brand)' }} />
      </div>
      <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Desk</h1>
      <p className="mt-2 max-w-xs text-sm" style={{ color: 'var(--text-2)' }}>
        Your return surface — recent highlights, notes, and Rooms — is coming soon.
        For now, jump into your <b>Library</b> or your <b>Locus</b>.
      </p>
    </div>
  );
}
