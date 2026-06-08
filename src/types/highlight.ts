export type ClippingType = 'highlight' | 'note' | 'bookmark' | 'unknown';

export type Highlight = {
  id: string;
  bookId: string;
  type: ClippingType;
  location?: string;
  page?: string;
  addedAt?: string;
  text: string;
  rawMetadata: string;
  important?: boolean;
  createdAt: string;
  updatedAt: string;
};
