export type Book = {
  id: string;
  title: string;
  author?: string;
  description?: string;
  source: 'kindle' | 'manual';
  tags?: string[];
  color?: string;
  totalHighlights: number;
  createdAt: string;
  updatedAt: string;
};

export type BookNote = {
  id: string;
  bookId: string;
  text: string;
  linkedHighlightId?: string;
  createdAt: string;
  updatedAt: string;
};
