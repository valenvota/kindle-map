import Dexie, { type Table } from 'dexie';
import type { Book, BookNote } from '../types/book';
import type { Highlight } from '../types/highlight';
import type { CanvasNodeData, CanvasEdge, Group } from '../types/canvas';
import type { KindleMap } from '../types/map';

export class KindleMapDB extends Dexie {
  books!: Table<Book, string>;
  highlights!: Table<Highlight, string>;
  canvasNodes!: Table<CanvasNodeData, string>;
  canvasEdges!: Table<CanvasEdge, string>;
  maps!: Table<KindleMap, string>;
  groups!: Table<Group, string>;
  bookNotes!: Table<BookNote, string>;

  constructor() {
    super('kindle-map-db');

    // v1 — original schema (never change this block)
    this.version(1).stores({
      books: 'id, title, author, source, createdAt',
      highlights: 'id, bookId, type, addedAt, createdAt',
      canvasNodes: 'id, bookId, groupId, type',
      groups: 'id, title, createdAt',
      bookNotes: 'id, bookId, createdAt',
    });

    // v2 — maps table + mapId on canvasNodes
    this.version(2)
      .stores({
        books: 'id, title, author, source, createdAt',
        highlights: 'id, bookId, type, addedAt, createdAt',
        canvasNodes: 'id, bookId, mapId, type',
        maps: 'id, name, createdAt',
        groups: 'id, title, createdAt',
        bookNotes: 'id, bookId, createdAt',
      })
      .upgrade(async (tx) => {
        const DEFAULT_MAP_ID = 'default-map';
        const now = new Date().toISOString();

        // Only create a default map if the user had existing canvas nodes
        // (i.e. they previously used the canvas in v1)
        const existing = await tx.table('canvasNodes').toArray();
        if (existing.length > 0) {
          await tx.table('maps').add({
            id: DEFAULT_MAP_ID,
            name: 'My Reading Map',
            createdAt: now,
            updatedAt: now,
          });

          // Re-key every node: id becomes `${mapId}:${bookId}`, add mapId field
          await tx.table('canvasNodes').clear();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.table('canvasNodes').bulkAdd(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            existing.map((n: any) => ({
              ...n,
              id: `${DEFAULT_MAP_ID}:${n.bookId ?? n.id}`,
              bookId: n.bookId ?? n.id,
              mapId: DEFAULT_MAP_ID,
            })),
          );
        }
      });

    // v3 — canvasEdges table (arrows/connections between nodes)
    this.version(3).stores({
      books: 'id, title, author, source, createdAt',
      highlights: 'id, bookId, type, addedAt, createdAt',
      canvasNodes: 'id, bookId, mapId, type',
      canvasEdges: 'id, mapId, source, target',
      maps: 'id, name, createdAt',
      groups: 'id, title, createdAt',
      bookNotes: 'id, bookId, createdAt',
    });
  }
}

export const db = new KindleMapDB();
