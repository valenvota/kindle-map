// Loci — DEV-ONLY manual seed for Slice 2 visual work. Never bundled into a
// production build (guarded by `import.meta.env.DEV`) and only ever touches the
// isolated dev database `kindle-map-dev` (see db.ts). It exists so we can
// explicitly create/reset a realistic "Locus with Rooms" scenario on demand,
// while the dev DB otherwise keeps a genuinely fresh/empty product state.
//
// Exposed on window in dev (see main.tsx):
//   __lociDevSeed()   → sample data + 2 extra maps, then run the real migration
//                       so today's maps become Rooms under one Locus root.
//   __lociDevReset()  → wipe kindle-map-dev back to empty.

import { db } from '../db/db';
import { loadSampleData } from './sampleData';
import { planLocusMigration } from '../db/locusMigration';
import type { KindleMap } from '../types/map';
import type { CanvasNodeData } from '../types/canvas';

const NOW = '2026-02-01T10:00:00.000Z';

// Two extra maps (on top of the sample "Focus & Attention" map) so the Locus has
// 3 Rooms. They reuse the sample books loaded by loadSampleData(), so each Room
// has real content inside. `dev-`-prefixed to stay clearly disposable.
const EXTRA_MAPS: KindleMap[] = [
  { id: 'dev-map-university', name: 'University', background: 'lines', createdAt: NOW, updatedAt: NOW },
  { id: 'dev-map-business', name: 'Business', background: 'dots', createdAt: NOW, updatedAt: NOW },
];

const EXTRA_NODES: CanvasNodeData[] = [
  { id: 'dev-map-university:topic-1', mapId: 'dev-map-university', type: 'topic', content: 'Cognitive Biases', position: { x: 80, y: 90 } },
  { id: 'dev-map-university:book-tfs', mapId: 'dev-map-university', type: 'book', bookId: 'sample-book-tfs', displayMode: 'cover', position: { x: 110, y: 220 } },
  { id: 'dev-map-university:note-1', mapId: 'dev-map-university', type: 'note', content: 'System 1 vs System 2 — the exam angle.', position: { x: 360, y: 130 }, width: 240, height: 150 },
  { id: 'dev-map-business:book-atomic', mapId: 'dev-map-business', type: 'book', bookId: 'sample-book-atomic', displayMode: 'card', position: { x: 90, y: 100 } },
  { id: 'dev-map-business:topic-1', mapId: 'dev-map-business', type: 'topic', content: 'Systems > Goals', position: { x: 140, y: 300 } },
];

/** Create the realistic Slice 2 scenario in the dev DB (idempotent). */
export async function devSeedLocus(): Promise<void> {
  if (!import.meta.env.DEV) {
    console.warn('[Loci dev] __lociDevSeed ignored — not a dev build.');
    return;
  }

  // Reuse the product's existing sample/explore data (books + the rich map).
  await loadSampleData();

  // Add the two extra maps + their content.
  await db.transaction('rw', [db.maps, db.canvasNodes], async () => {
    await db.maps.bulkPut(EXTRA_MAPS);
    await db.canvasNodes.bulkPut(EXTRA_NODES);
  });

  // Run the REAL migration transform (same one src/db/db.ts wraps) to build the
  // single Locus root, re-parent the maps, and generate the Room cards. This is
  // idempotent, so re-running the seed doesn't duplicate anything.
  const maps = await db.maps.toArray();
  const roomNodes = await db.canvasNodes.where('type').equals('room').toArray();
  const plan = planLocusMigration({
    maps,
    roomNodes,
    now: new Date().toISOString(),
    newRootId: () => `locus-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
  });
  await db.transaction('rw', [db.maps, db.canvasNodes], async () => {
    for (const root of plan.rootsToAdd) await db.maps.add(root);
    for (const rp of plan.mapsToReparent) await db.maps.update(rp.id, { parentId: rp.parentId });
    if (plan.roomNodesToAdd.length > 0) await db.canvasNodes.bulkAdd(plan.roomNodesToAdd);
  });

  const rooms = maps.filter((m) => !m.isRoot).length;
  console.info(`[Loci dev] seeded kindle-map-dev: 1 Locus root + ${rooms} Rooms. Open Maps → "My Locus". Reload the page if the app was already loaded.`);
}

/** Wipe the dev DB back to empty (fresh product state). */
export async function devResetLocus(): Promise<void> {
  if (!import.meta.env.DEV) {
    console.warn('[Loci dev] __lociDevReset ignored — not a dev build.');
    return;
  }
  const tables = [db.books, db.highlights, db.bookNotes, db.maps, db.canvasNodes, db.canvasEdges, db.canvasStrokes];
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()));
  });
  console.info('[Loci dev] reset complete — kindle-map-dev is empty. Reload the page to see the fresh state.');
}
