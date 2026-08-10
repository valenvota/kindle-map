// Soft-delete — Backend Spike Phase A2 (see BACKEND_SPIKE.md §5.3).
//
// Synced rows are never hard-deleted; a delete sets `deletedAt` (a tombstone) so
// the removal can propagate once cloud sync lands. Reads filter tombstones out
// with `notDeleted`, so the UI looks identical to a hard delete. The auto-stamp
// `updating` hook (db.ts) bumps `updatedAt` whenever `deletedAt` is set, so a
// tombstone is a normal change for the future push-scan.
//
// Two deliberate exceptions keep raw (non-filtered) reads:
//   • existence checks in upserts / import — they must SEE a tombstone to avoid a
//     ConstraintError on re-add and to revive it instead (clear `deletedAt`).
//   • sample-data cleanup hard-deletes (demo data, never synced, must leave zero
//     residue) — see utils/sampleData.ts.

/** True for a live (non-tombstoned) row. Use as a Dexie `.filter()` / `.and()`. */
export const notDeleted = <T extends { deletedAt?: string }>(row: T): boolean => !row.deletedAt;
