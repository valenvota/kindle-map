export type CanvasNodeData = {
  /** Format: `${mapId}:${bookId}` — scoped so the same book can exist in multiple maps */
  id: string;
  mapId: string;
  bookId: string;
  type: 'book' | 'topic' | 'note';
  position: { x: number; y: number };
  width?: number;
  height?: number;
};

export type Group = {
  id: string;
  title: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
};
