/**
 * One-shot signal so a freshly created text box mounts already in edit mode.
 *
 * PlusMenu creates the node in Dexie and calls `requestTextEdit(id)`; the node
 * then mounts (via the live-query sync) and `consumeTextEdit(id)` returns true
 * exactly once, letting TextBoxNode open focused. Module-level so it survives
 * the async gap between create and mount; cleared on consume.
 */
let pendingId: string | null = null;

export function requestTextEdit(id: string): void {
  pendingId = id;
}

export function consumeTextEdit(id: string): boolean {
  if (pendingId === id) {
    pendingId = null;
    return true;
  }
  return false;
}
