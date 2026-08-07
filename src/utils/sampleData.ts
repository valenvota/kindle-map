import { db } from '../db/db';
import type { Book, BookNote } from '../types/book';
import type { Highlight } from '../types/highlight';
import type { KindleMap } from '../types/map';
import type { CanvasNodeData, CanvasEdge } from '../types/canvas';

/**
 * A small, curated demo of KindleMap — a real reading workflow, not placeholder
 * lorem. "Explore with example" loads this so someone without a Kindle export
 * can understand the product in ~30 seconds: a few real books with highlights
 * and a note, plus one map that connects them into an idea (books → a topic →
 * a quote → a note, grouped inside a region).
 *
 * Everything is id-prefixed `sample-` (the map's nodes are `sample-map:…`), so
 * clearSampleData() can remove it cleanly with no trace and no schema field.
 */

const SAMPLE_PREFIX = 'sample-';
const MAP_ID = 'sample-map';
const NOW = '2026-01-15T10:00:00.000Z';

function book(id: string, title: string, author: string, status: Book['readingStatus'], total: number, description: string): Book {
  return { id, title, author, source: 'kindle', readingStatus: status, totalHighlights: total, description, createdAt: NOW, updatedAt: NOW };
}

function hl(id: string, bookId: string, text: string, important = false): Highlight {
  return { id, bookId, type: 'highlight', text, rawMetadata: 'Sample highlight', important, addedAt: NOW, createdAt: NOW, updatedAt: NOW };
}

function node(n: Omit<CanvasNodeData, 'mapId'>): CanvasNodeData {
  return { mapId: MAP_ID, ...n };
}

// Nodes expose four named source handles (top/right/bottom/left) and no default,
// so sample edges must name the handles they attach to or React Flow drops them.
function edge(source: string, sourceHandle: string, target: string, targetHandle: string, label?: string): CanvasEdge {
  return { id: `sample-edge-${source}-${target}`, mapId: MAP_ID, source, sourceHandle, target, targetHandle, direction: 'forward', label, createdAt: NOW };
}

const BOOKS: Book[] = [
  book('sample-book-deep', 'Deep Work', 'Cal Newport', 'reading', 3, 'Rules for focused success in a distracted world.'),
  book('sample-book-tfs', 'Thinking, Fast and Slow', 'Daniel Kahneman', 'finished', 2, 'How two systems of thought shape our judgment.'),
  book('sample-book-atomic', 'Atomic Habits', 'James Clear', 'want-to-read', 1, 'Tiny changes, remarkable results.'),
];

const HIGHLIGHTS: Highlight[] = [
  hl('sample-hl-deep-1', 'sample-book-deep', 'Human beings, it seems, are at their best when immersed deeply in something challenging.', true),
  hl('sample-hl-deep-2', 'sample-book-deep', 'Clarity about what matters provides clarity about what does not.'),
  hl('sample-hl-deep-3', 'sample-book-deep', 'Busyness as a proxy for productivity: doing lots of stuff in a visible manner.'),
  hl('sample-hl-tfs-1', 'sample-book-tfs', 'Nothing in life is as important as you think it is while you are thinking about it.', true),
  hl('sample-hl-tfs-2', 'sample-book-tfs', 'A reliable way to make people believe in falsehoods is frequent repetition.'),
  hl('sample-hl-atomic-1', 'sample-book-atomic', 'You do not rise to the level of your goals. You fall to the level of your systems.', true),
];

const NOTES: BookNote[] = [
  { id: 'sample-note-deep-1', bookId: 'sample-book-deep', text: 'The through-line across these books: attention is the scarce resource. Everything else is a fight to protect it.', createdAt: NOW, updatedAt: NOW },
];

const NODES: CanvasNodeData[] = [
  // A soft region grouping the "attention thesis" cluster (sits behind the rest).
  node({ id: `${MAP_ID}:region-1`, type: 'region', content: 'The attention thesis', position: { x: 40, y: 40 }, width: 660, height: 470, style: { background: 'rgba(61,107,142,0.06)' } }),
  // Two books, one as a cover, one as a card.
  node({ id: `${MAP_ID}:sample-book-deep`, type: 'book', bookId: 'sample-book-deep', displayMode: 'cover', position: { x: 90, y: 110 } }),
  node({ id: `${MAP_ID}:sample-book-tfs`, type: 'book', bookId: 'sample-book-tfs', displayMode: 'card', position: { x: 320, y: 110 } }),
  // The topic they share.
  node({ id: `${MAP_ID}:topic-1`, type: 'topic', content: 'Attention', position: { x: 130, y: 400 } }),
  // A quote pulled from a real highlight.
  node({ id: `${MAP_ID}:quote-1`, type: 'quote', bookId: 'sample-book-deep', highlightId: 'sample-hl-deep-1', content: 'Human beings are at their best when immersed deeply in something challenging.', position: { x: 360, y: 300 }, width: 300, height: 180 }),
  // A free text label + a paper note off to the side.
  node({ id: `${MAP_ID}:text-1`, type: 'text', content: 'the scarce resource', position: { x: 770, y: 150 }, width: 220, height: 48 }),
  node({ id: `${MAP_ID}:note-1`, type: 'note', content: 'Protect your attention like it is the whole game — because it is.', position: { x: 760, y: 250 }, width: 240, height: 160 }),
];

const EDGES: CanvasEdge[] = [
  edge(`${MAP_ID}:sample-book-deep`, 'bottom', `${MAP_ID}:topic-1`, 'top'),
  edge(`${MAP_ID}:sample-book-tfs`, 'bottom', `${MAP_ID}:topic-1`, 'top'),
  edge(`${MAP_ID}:topic-1`, 'right', `${MAP_ID}:quote-1`, 'left', 'e.g.'),
  edge(`${MAP_ID}:topic-1`, 'right', `${MAP_ID}:note-1`, 'left'),
];

const MAP: KindleMap = { id: MAP_ID, name: 'Focus & Attention', background: 'dots', createdAt: NOW, updatedAt: NOW };

export async function loadSampleData(): Promise<void> {
  await db.transaction('rw', [db.books, db.highlights, db.bookNotes, db.maps, db.canvasNodes, db.canvasEdges], async () => {
    await db.books.bulkPut(BOOKS);
    await db.highlights.bulkPut(HIGHLIGHTS);
    await db.bookNotes.bulkPut(NOTES);
    await db.maps.put(MAP);
    await db.canvasNodes.bulkPut(NODES);
    await db.canvasEdges.bulkPut(EDGES);
  });
}

/** Remove every `sample-`-prefixed record across all stores — no trace left. */
export async function clearSampleData(): Promise<void> {
  const bySamplePrefix = (r: { id: string }) => r.id.startsWith(SAMPLE_PREFIX);
  const tables = [db.books, db.highlights, db.bookNotes, db.maps, db.canvasNodes, db.canvasEdges, db.canvasStrokes];
  await db.transaction('rw', tables, async () => {
    for (const table of tables) {
      const ids = (await table.toArray()).filter(bySamplePrefix).map((r) => r.id);
      if (ids.length) await table.bulkDelete(ids);
    }
  });
}
