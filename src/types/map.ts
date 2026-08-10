/** Canvas wallpaper preset. Undefined ⇒ 'dots' (the original desk background). */
export type MapBackground = 'dots' | 'grid' | 'lines' | 'plain';

export type KindleMap = {
  id: string;
  name: string;
  /** Per-map wallpaper preset (Sprint 4). Undefined ⇒ 'dots'. */
  background?: MapBackground;
  createdAt: string;
  updatedAt: string;
  /** Sync (Backend Spike Phase A): per-row owner + soft-delete tombstone. */
  ownerId?: string;
  deletedAt?: string;
};
