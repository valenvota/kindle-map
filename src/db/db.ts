import Dexie, { type Table } from 'dexie';
import type { Book, BookNote } from '../types/book';
import type { Highlight } from '../types/highlight';
import type { CanvasNodeData, Group } from '../types/canvas';

export class KindleMapDB extends Dexie {
  books!: Table<Book, string>;
  highlights!: Table<Highlight, string>;
  canvasNodes!: Table<CanvasNodeData, string>;
  groups!: Table<Group, string>;
  bookNotes!: Table<BookNote, string>;

  constructor() {
    super('kindle-map-db');

    this.version(1).stores({
      books: 'id, title, author, source, createdAt',
      highlights: 'id, bookId, type, addedAt, createdAt',
      canvasNodes: 'id, bookId, groupId, type',
      groups: 'id, title, createdAt',
      bookNotes: 'id, bookId, createdAt',
    });
  }
}

export const db = new KindleMapDB();
