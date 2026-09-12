/**
 * One-shot signal so a freshly created Room card mounts already in inline-rename
 * mode. Mirrors `textAutoEdit`: `createRoom` runs, the caller calls
 * `requestRoomNameEdit(cardId)`, the card then mounts (via the live-query sync)
 * and `consumeRoomNameEdit(cardId)` returns true exactly once, letting RoomNode
 * open focused. Module-level so it survives the async gap between create and
 * mount; cleared on consume.
 */
let pendingId: string | null = null;

export function requestRoomNameEdit(id: string): void {
  pendingId = id;
}

export function consumeRoomNameEdit(id: string): boolean {
  if (pendingId === id) {
    pendingId = null;
    return true;
  }
  return false;
}
