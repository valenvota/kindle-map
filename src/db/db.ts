import Dexie, { type Table } from 'dexie';
import type { Book, BookNote } from '../types/book';
import type { Highlight } from '../types/highlight';
import type { CanvasNodeData, CanvasEdge, CanvasStroke, Group } from '../types/canvas';
import type { KindleMap } from '../types/map';
import { getLocalOwnerId } from '../utils/localOwner';

// Tables that participate in cloud sync (Backend Spike). `groups` is legacy/unused
// and deliberately excluded. Every write to these gets `ownerId` + `updatedAt`
// auto-stamped (see installSyncHooks); the v11 migration backfills existing rows.
const SYNCED_TABLES = [
  'books', 'highlights', 'bookNotes', 'maps', 'canvasNodes', 'canvasEdges', 'canvasStrokes',
] as const;

export class KindleMapDB extends Dexie {
  books!: Table<Book, string>;
  highlights!: Table<Highlight, string>;
  canvasNodes!: Table<CanvasNodeData, string>;
  canvasEdges!: Table<CanvasEdge, string>;
  canvasStrokes!: Table<CanvasStroke, string>;
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

    // v4 — coverImage field on books (manual upload, base64 data URI). No index
    // change needed, but Dexie requires a version bump to register schema intent.
    this.version(4).stores({
      books: 'id, title, author, source, createdAt',
      highlights: 'id, bookId, type, addedAt, createdAt',
      canvasNodes: 'id, bookId, mapId, type',
      canvasEdges: 'id, mapId, source, target',
      maps: 'id, name, createdAt',
      groups: 'id, title, createdAt',
      bookNotes: 'id, bookId, createdAt',
    });

    // v5 — readingStatus field on books ('want-to-read' | 'reading' | 'finished').
    // No index needed; filtering is done in JS.
    this.version(5).stores({
      books: 'id, title, author, source, createdAt',
      highlights: 'id, bookId, type, addedAt, createdAt',
      canvasNodes: 'id, bookId, mapId, type',
      canvasEdges: 'id, mapId, source, target',
      maps: 'id, name, createdAt',
      groups: 'id, title, createdAt',
      bookNotes: 'id, bookId, createdAt',
    });

    // v6 — canvasStrokes table for freehand drawing (pencil/marker/eraser)
    this.version(6).stores({
      books: 'id, title, author, source, createdAt',
      highlights: 'id, bookId, type, addedAt, createdAt',
      canvasNodes: 'id, bookId, mapId, type',
      canvasEdges: 'id, mapId, source, target',
      canvasStrokes: 'id, mapId',
      maps: 'id, name, createdAt',
      groups: 'id, title, createdAt',
      bookNotes: 'id, bookId, createdAt',
    });

    // v7 — displayMode field on canvasNodes (book nodes: 'card' | 'cover').
    // Optional field, no index change; absence already means 'card' so no
    // data migration is needed — the version bump just registers schema intent.
    this.version(7).stores({
      books: 'id, title, author, source, createdAt',
      highlights: 'id, bookId, type, addedAt, createdAt',
      canvasNodes: 'id, bookId, mapId, type',
      canvasEdges: 'id, mapId, source, target',
      canvasStrokes: 'id, mapId',
      maps: 'id, name, createdAt',
      groups: 'id, title, createdAt',
      bookNotes: 'id, bookId, createdAt',
    });

    // v8 — zIndex field on canvasNodes (canvas stacking order). Optional, no
    // index change; absence resolves by node type (see canvas/layerOrder.ts),
    // so no data migration is needed — this registers schema intent only.
    this.version(8).stores({
      books: 'id, title, author, source, createdAt',
      highlights: 'id, bookId, type, addedAt, createdAt',
      canvasNodes: 'id, bookId, mapId, type',
      canvasEdges: 'id, mapId, source, target',
      canvasStrokes: 'id, mapId',
      maps: 'id, name, createdAt',
      groups: 'id, title, createdAt',
      bookNotes: 'id, bookId, createdAt',
    });

    // v9 — canvas authoring (Sprint 3B). Adds the 'text' node type (free text
    // boxes) and extends the existing optional width/height fields to note and
    // quote nodes so they resize like shapes. The `type` index is value-agnostic
    // (a new type value needs no index change) and width/height already exist,
    // so no data migration is needed — this registers schema intent only.
    this.version(9).stores({
      books: 'id, title, author, source, createdAt',
      highlights: 'id, bookId, type, addedAt, createdAt',
      canvasNodes: 'id, bookId, mapId, type',
      canvasEdges: 'id, mapId, source, target',
      canvasStrokes: 'id, mapId',
      maps: 'id, name, createdAt',
      groups: 'id, title, createdAt',
      bookNotes: 'id, bookId, createdAt',
    });

    // v10 — canvas creative layer (Sprint 4). Adds the 'image' and 'region' node
    // types, an optional `locked` flag on canvasNodes (pin-to-desk), and an
    // optional `background` field on maps (wallpaper preset). The `type` index is
    // value-agnostic, and `locked`/`background` are non-indexed optional fields
    // that default by absence, so no data migration is needed — this registers
    // schema intent only.
    this.version(10).stores({
      books: 'id, title, author, source, createdAt',
      highlights: 'id, bookId, type, addedAt, createdAt',
      canvasNodes: 'id, bookId, mapId, type',
      canvasEdges: 'id, mapId, source, target',
      canvasStrokes: 'id, mapId',
      maps: 'id, name, createdAt',
      groups: 'id, title, createdAt',
      bookNotes: 'id, bookId, createdAt',
    });

    // v11 — Backend Spike Phase A (local foundation, still 100% offline). Adds the
    // sync-ready fields `ownerId` / `updatedAt` / `deletedAt` to every synced table.
    // `updatedAt` becomes an index (drives the future push-scan). This is the first
    // non-no-op migration since v2: it backfills existing rows (canvasNodes never
    // had a timestamp → `now`; strokes/edges → their `createdAt`) and stamps the
    // per-device `ownerId`. `deletedAt` needs no backfill (absence ⇒ live).
    this.version(11)
      .stores({
        books: 'id, title, author, source, createdAt, updatedAt',
        highlights: 'id, bookId, type, addedAt, createdAt, updatedAt',
        canvasNodes: 'id, bookId, mapId, type, updatedAt',
        canvasEdges: 'id, mapId, source, target, updatedAt',
        canvasStrokes: 'id, mapId, updatedAt',
        maps: 'id, name, createdAt, updatedAt',
        groups: 'id, title, createdAt',
        bookNotes: 'id, bookId, createdAt, updatedAt',
      })
      .upgrade(async (tx) => {
        const ownerId = getLocalOwnerId();
        const now = new Date().toISOString();
        // Sequential (not Promise.all) — it's a one-time migration, and running the
        // modifies one table at a time avoids any parallel-op subtleties on the
        // single upgrade transaction.
        for (const name of SYNCED_TABLES) {
          await tx.table(name).toCollection().modify((row) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const r = row as any;
            if (!r.ownerId) r.ownerId = ownerId;
            if (!r.updatedAt) r.updatedAt = r.createdAt ?? now;
          });
        }
      });

    this.installSyncHooks();
  }

  /**
   * Auto-stamp sync metadata on every write to a synced table, so the ~36
   * scattered write sites don't each have to remember (Backend Spike §6.3).
   * `creating` fills missing `ownerId` / `updatedAt`; `updating` bumps
   * `updatedAt` on any mutation (unless the caller set it) so the future
   * push-scan always sees the change. Soft-delete (the `deleting` interceptor)
   * is deliberately NOT here yet — it lands in Phase A2.
   */
  private installSyncHooks() {
    const stampCreate = (obj: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = obj as any;
      if (!r.ownerId) r.ownerId = getLocalOwnerId();
      if (!r.updatedAt) r.updatedAt = new Date().toISOString();
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stampUpdate = (mods: any, obj: any): Record<string, unknown> | undefined => {
      const extra: Record<string, unknown> = {};
      if (mods.updatedAt === undefined) extra.updatedAt = new Date().toISOString();
      if (obj.ownerId === undefined && mods.ownerId === undefined) extra.ownerId = getLocalOwnerId();
      return Object.keys(extra).length ? extra : undefined;
    };
    for (const name of SYNCED_TABLES) {
      const table = this.table(name);
      table.hook('creating', (_pk, obj) => stampCreate(obj));
      table.hook('updating', (mods, _pk, obj) => stampUpdate(mods, obj));
    }
  }
}

export const db = new KindleMapDB();
