export type ShapeKind = 'rectangle' | 'circle';

export type CanvasNodeData = {
  /** `${mapId}:${bookId}` for books; `${mapId}:topic-${ts}` for topics; etc. */
  id: string;
  mapId: string;
  /** Present for book and quote nodes */
  bookId?: string;
  /** Present for quote nodes — source of truth for the original highlight */
  highlightId?: string;
  type: 'book' | 'topic' | 'note' | 'quote' | 'shape';
  /** Topic label, note text, denormalized quote text, or shape label */
  content?: string;
  /** Present for shape nodes */
  shapeKind?: ShapeKind;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  /** Optional style overrides — topic/note/quote/shape nodes only */
  style?: {
    background?: string;
    border?: string;
    text?: string;
  };
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
};

export type Group = {
  id: string;
  title: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
};
