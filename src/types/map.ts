/** Canvas wallpaper preset. Undefined ⇒ 'dots' (the original desk background). */
export type MapBackground = 'dots' | 'grid' | 'lines' | 'plain';

export type KindleMap = {
  id: string;
  name: string;
  /** Per-map wallpaper preset (Sprint 4). Undefined ⇒ 'dots'. */
  background?: MapBackground;
  /**
   * Loci L1 — the map tree. Undefined for the Locus root and for legacy/orphan
   * maps; a child Room points at its parent's map id. Maps become a tree; the
   * breadcrumb walks this upward. Absence is NOT how the root is identified
   * (see `isRoot`).
   */
  parentId?: string;
  /**
   * Loci L1 — the Locus root marker. Exactly one live map per owner carries
   * `isRoot: true`. The root's identity is this flag plus its ordinary unique
   * `id` — deliberately independent of `ownerId`, so a future local→authenticated
   * claim (Backend Spike §5.1) only re-stamps the owner field and never re-keys
   * the root. `createMap` never sets this, so it can never mint an accidental root.
   */
  isRoot?: boolean;
  createdAt: string;
  updatedAt: string;
  /** Sync (Backend Spike Phase A): per-row owner + soft-delete tombstone. */
  ownerId?: string;
  deletedAt?: string;
};
