export type CanvasNodeData = {
  /** `${mapId}:${bookId}` for books; `${mapId}:topic-${ts}` for topics; etc. */
  id: string;
  mapId: string;
  /** Present for book and quote nodes */
  bookId?: string;
  /** Present for quote nodes — source of truth for the original highlight */
  highlightId?: string;
  type: 'book' | 'topic' | 'note' | 'quote';
  /** Topic label, note text, or denormalized quote text for rendering */
  content?: string;
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
