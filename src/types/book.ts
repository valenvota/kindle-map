export type ReadingStatus = 'want-to-read' | 'reading' | 'finished';

export type Book = {
  id: string;
  title: string;
  author?: string;
  description?: string;
  source: 'kindle' | 'manual';
  tags?: string[];
  color?: string;
  /** Base64 data URI (compressed/downscaled before storing), manual upload only */
  coverImage?: string;
  readingStatus?: ReadingStatus;
  totalHighlights: number;
  createdAt: string;
  updatedAt: string;
  /** Sync (Backend Spike Phase A): per-row owner + soft-delete tombstone. */
  ownerId?: string;
  deletedAt?: string;
};

export type BookNote = {
  id: string;
  bookId: string;
  text: string;
  linkedHighlightId?: string;
  createdAt: string;
  updatedAt: string;
  /** Sync (Backend Spike Phase A): per-row owner + soft-delete tombstone. */
  ownerId?: string;
  deletedAt?: string;
};
