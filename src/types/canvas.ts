export type ShapeKind = 'rectangle' | 'circle';

export type CanvasNodeData = {
  /** `${mapId}:${bookId}` for books; `${mapId}:topic-${ts}` for topics; etc. */
  id: string;
  mapId: string;
  /** Present for book and quote nodes */
  bookId?: string;
  /** Present for quote nodes — source of truth for the original highlight */
  highlightId?: string;
  type: 'book' | 'topic' | 'note' | 'quote' | 'shape' | 'text' | 'image' | 'region';
  /**
   * Topic label, note text, denormalized quote text, shape label, text-box text,
   * region title, or — for image nodes — the (downscaled) image data URI.
   */
  content?: string;
  /** Present for shape nodes */
  shapeKind?: ShapeKind;
  /** BookNode-only: how the book renders on the canvas. Undefined ⇒ 'card' (legacy default). */
  displayMode?: 'card' | 'cover';
  /**
   * Pinned to the desk: can't be dragged and won't connect, but stays selectable
   * so it can be unpinned. Undefined ⇒ not pinned. See Sprint 4.
   */
  locked?: boolean;
  /** Canvas stacking order. Undefined ⇒ resolved by type — see `resolveZ` in canvas/layerOrder.ts. */
  zIndex?: number;
  position: { x: number; y: number };
  /** Resizable nodes (shape/note/quote/text/image/region). Undefined ⇒ the node's default size. */
  width?: number;
  height?: number;
  /** Optional style overrides — topic/note/quote/shape/text/region nodes only */
  style?: {
    background?: string;
    border?: string;
    text?: string;
  };
  /** Sync (Backend Spike Phase A). Nodes had no timestamp before; the v11 migration
   *  backfills `updatedAt`. `ownerId` = per-row owner, `deletedAt` = tombstone. */
  updatedAt?: string;
  ownerId?: string;
  deletedAt?: string;
};

export type EdgeDirection = 'forward' | 'backward' | 'both' | 'none';

export type CanvasEdge = {
  id: string;
  mapId: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  direction?: EdgeDirection;
  label?: string;
  createdAt: string;
  /** Sync (Backend Spike Phase A): the v11 migration backfills `updatedAt` from
   *  `createdAt`. `ownerId` = per-row owner, `deletedAt` = tombstone. */
  updatedAt?: string;
  ownerId?: string;
  deletedAt?: string;
};

export type StrokePoint = { x: number; y: number; pressure: number };
export type StrokeTool = 'pencil' | 'marker' | 'eraser';

export type CanvasStroke = {
  id: string;
  mapId: string;
  tool: StrokeTool;
  color: string;
  width: number;
  points: StrokePoint[];
  createdAt: string;
  /** Sync (Backend Spike Phase A): the v11 migration backfills `updatedAt` from
   *  `createdAt`. `ownerId` = per-row owner, `deletedAt` = tombstone. */
  updatedAt?: string;
  ownerId?: string;
  deletedAt?: string;
};

export type Group = {
  id: string;
  title: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
};
