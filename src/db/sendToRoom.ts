import { db } from './db';
import { getCanvasNodesByMap } from './canvasRepository';
import { nodeGridPosition } from '../utils/nodeLayout';
import type { CanvasNodeData } from '../types/canvas';
import type { Highlight } from '../types/highlight';

export type SendToRoomResult = { added: number; skipped: number };

/** Deterministic per-Room quote id — mirrors `AddQuoteModal`. The same highlight
 *  can live in different Rooms (different `mapId`), but never twice in the same
 *  Room (identical id → idempotent write, not a duplicate). */
export function quoteNodeId(mapId: string, highlightId: string): string {
  return `${mapId}:quote-${highlightId}`;
}

/**
 * L3 Slice 1 — send highlights into an existing Room as `quote` nodes.
 *
 * Reuses the exact `AddQuoteModal` quote shape, dedupes against quote nodes
 * already in the target Room, and lays the new batch out with the canonical node
 * grid starting after the Room's existing content.
 *
 * Write path: a single `bulkPut`. It is atomic on its own, and the table-level
 * `creating` hook installed in `db.ts` stamps `ownerId` / `updatedAt` for every
 * row — so this neither hand-stamps sync metadata nor wraps a redundant
 * transaction, and it doesn't reimplement `upsertCanvasNode`'s put semantics.
 */
export async function sendHighlightsToRoom(
  targetMapId: string,
  bookId: string,
  highlights: Highlight[],
): Promise<SendToRoomResult> {
  const existing = await getCanvasNodesByMap(targetMapId);
  const existingIds = new Set(existing.map((n) => n.id));

  const toAdd: CanvasNodeData[] = [];
  let placed = existing.length;
  for (const h of highlights) {
    const id = quoteNodeId(targetMapId, h.id);
    if (existingIds.has(id)) continue; // already in this Room → skip
    toAdd.push({
      id,
      mapId: targetMapId,
      bookId,
      highlightId: h.id,
      type: 'quote',
      content: h.text,
      position: nodeGridPosition(placed),
    });
    placed += 1;
  }

  if (toAdd.length > 0) await db.canvasNodes.bulkPut(toAdd);
  return { added: toAdd.length, skipped: highlights.length - toAdd.length };
}
