/** Canvas wallpaper preset. Undefined ⇒ 'dots' (the original desk background). */
export type MapBackground = 'dots' | 'grid' | 'lines' | 'plain';

export type KindleMap = {
  id: string;
  name: string;
  /** Per-map wallpaper preset (Sprint 4). Undefined ⇒ 'dots'. */
  background?: MapBackground;
  createdAt: string;
  updatedAt: string;
};
