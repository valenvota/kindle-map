/**
 * One-shot signal so a Room card enters inline-rename mode.
 *
 * Two callers reach it:
 *  - Create (L2.1 Slice A): `createRoom` runs, the canvas calls
 *    `requestRoomNameEdit(cardId)`, and the freshly-mounted RoomNode consumes it
 *    once in its lazy `useState` initializer — the card opens focused on arrival.
 *  - Rename (Slice B): the Room already exists and is mounted, so a lazy consume
 *    never re-runs. `requestRoomNameEdit` therefore also NOTIFIES subscribers, and
 *    a mounted RoomNode listening via `subscribeRoomNameEdit` consumes for its own
 *    id and opens the same editor.
 *
 * `pending` is module-level so it survives the async gap between create and mount;
 * it is cleared on consume, so exactly one card ever opens per request.
 */
let pendingId: string | null = null;

type Listener = (id: string) => void;
const listeners = new Set<Listener>();

export function requestRoomNameEdit(id: string): void {
  pendingId = id;
  // Notify mounted cards (rename path); a not-yet-mounted card (create path)
  // has no listener and instead consumes at mount.
  for (const fn of listeners) fn(id);
}

export function consumeRoomNameEdit(id: string): boolean {
  if (pendingId === id) {
    pendingId = null;
    return true;
  }
  return false;
}

/** Subscribe to rename requests; returns an unsubscribe fn. */
export function subscribeRoomNameEdit(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
