// Loci L1 — Dexie v12 migration transform (pure, no I/O).
//
// Turns today's flat list of maps into the Locus tree, without moving or
// mutating any existing row destructively:
//   1. ensure one Locus root per owner (a map with `isRoot: true`),
//   2. re-parent every existing (non-root) map under its owner's root,
//   3. generate one `room` node on the root per migrated map (the Room card).
//
// This is a *planner*: it reads the current rows and returns the writes to apply.
// Keeping it pure makes the migration invariants and idempotency unit-testable
// off a browser (see the Slice 1 test), and lets the Dexie `.upgrade()` callback
// stay a thin wrapper (see db.ts).
//
// Root identity is deliberately owner-independent: the root is found by the
// `isRoot` flag, and its `id` is an ordinary unique id — never derived from
// `ownerId`. A future local→authenticated claim (Backend Spike §5.1) rewrites the
// `ownerId` field on rows but preserves their `id`, so nothing here has to be
// re-keyed. The planner also never deletes or merges a second `isRoot` map: if an
// owner somehow has two (the future L7 multi-device claim edge case), the earliest
// is treated as canonical and the extra is left untouched for L7 to reconcile.

import type { KindleMap } from '../types/map';
import type { CanvasNodeData } from '../types/canvas';

export type LocusMigrationPlan = {
  /** Locus roots to create (owners that had maps but no root yet). */
  rootsToAdd: KindleMap[];
  /** Existing maps to re-parent under their owner's root. */
  mapsToReparent: { id: string; parentId: string }[];
  /** `room` nodes (Room cards) to add on each root. */
  roomNodesToAdd: CanvasNodeData[];
};

export type PlanLocusMigrationInput = {
  /** All rows of the `maps` table (live and tombstoned). */
  maps: KindleMap[];
  /** Existing `type: 'room'` canvas nodes (empty on the first v11→v12 upgrade). */
  roomNodes: CanvasNodeData[];
  /** ISO timestamp to stamp on created rows. */
  now: string;
  /** Factory for fresh, owner-independent root ids (e.g. a UUID). */
  newRootId: () => string;
  /** Display name for a newly created root. Defaults to 'My Locus'. */
  rootName?: string;
};

// Room-card grid on the root. Sized to the book card (288px) like the canvas'
// own auto-arrange (ReadingCanvas), so generated cards never overlap.
const CARD_W = 288;
const CARD_H = 180;
const COL_GAP = 40;
const ROW_GAP = 40;
const ORIGIN = 60;
const COLS = 4;

function gridPosition(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    x: ORIGIN + col * (CARD_W + COL_GAP),
    y: ORIGIN + row * (CARD_H + ROW_GAP),
  };
}

/** Group key for an owner. Undefined owners bucket together (harmless — v11
 *  backfilled `ownerId` on every existing row, so in practice there is one). */
function ownerKey(ownerId: string | undefined): string {
  return ownerId ?? '';
}

export function planLocusMigration(input: PlanLocusMigrationInput): LocusMigrationPlan {
  const { maps, roomNodes, now } = input;
  const rootName = input.rootName ?? 'My Locus';

  const plan: LocusMigrationPlan = { rootsToAdd: [], mapsToReparent: [], roomNodesToAdd: [] };

  // Bucket maps by owner, splitting the (canonical) root from the children.
  const owners = new Map<string, { root?: KindleMap; children: KindleMap[] }>();
  for (const m of maps) {
    const key = ownerKey(m.ownerId);
    let bucket = owners.get(key);
    if (!bucket) {
      bucket = { children: [] };
      owners.set(key, bucket);
    }
    if (m.isRoot) {
      // First root (by createdAt) is canonical; extras are left for L7 to reconcile.
      if (!bucket.root || m.createdAt < bucket.root.createdAt) bucket.root = m;
    } else {
      bucket.children.push(m);
    }
  }

  for (const [key, bucket] of owners) {
    const ownerId = key === '' ? undefined : key;

    // Resolve or create the root. An owner with only a root (no children) needs
    // nothing done; an owner with no maps at all never appears in this loop.
    let rootId: string;
    if (bucket.root) {
      rootId = bucket.root.id;
    } else {
      if (bucket.children.length === 0) continue;
      rootId = input.newRootId();
      plan.rootsToAdd.push({
        id: rootId,
        name: rootName,
        isRoot: true,
        createdAt: now,
        updatedAt: now,
        ownerId,
      });
    }

    // Room targets already carded on this root — drives card idempotency.
    const carded = new Set<string>();
    for (const n of roomNodes) {
      if (n.mapId === rootId && n.roomId && !n.deletedAt) carded.add(n.roomId);
    }

    let gridIndex = carded.size;
    for (const child of bucket.children) {
      // Re-parent only if not already parented (convergent / idempotent).
      if (!child.parentId) {
        plan.mapsToReparent.push({ id: child.id, parentId: rootId });
      }
      // Card only live maps, and only once. A tombstoned map is re-parented
      // (harmless) but gets no Room card.
      if (child.deletedAt) continue;
      if (carded.has(child.id)) continue;
      plan.roomNodesToAdd.push({
        // Deterministic id (mirrors the `${mapId}:${bookId}` node id convention),
        // so even a missed idempotency check can't duplicate a card.
        id: `${rootId}:room-${child.id}`,
        mapId: rootId,
        type: 'room',
        roomId: child.id,
        content: child.name,
        position: gridPosition(gridIndex++),
        updatedAt: now,
        ownerId,
      });
      carded.add(child.id);
    }
  }

  return plan;
}
