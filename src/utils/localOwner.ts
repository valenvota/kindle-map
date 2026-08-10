// Local-first owner identity — Backend Spike Phase A (see BACKEND_SPIKE.md §5.1).
//
// Every synced row is stamped with an `ownerId`. Until cloud auth lands (Phase B+)
// that id is a random per-device UUID kept in localStorage: no network, no account,
// works fully offline. When the user later opts into an account, this local id is
// what gets *claimed* — their existing local data is rewritten to the signed-in
// user id rather than lost. Nothing here contacts a backend.

const KEY = 'km-local-owner-id';

let cached: string | null = null;

function fresh(): string {
  return crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Stable per-device owner id. Created on first use, then persisted + memoized. */
export function getLocalOwnerId(): string {
  if (cached) return cached;
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return (cached = existing);
    const id = fresh();
    localStorage.setItem(KEY, id);
    return (cached = id);
  } catch {
    // localStorage unavailable (e.g. hardened private mode) — fall back to an
    // ephemeral in-memory id so writes still succeed this session.
    return (cached ??= fresh());
  }
}
