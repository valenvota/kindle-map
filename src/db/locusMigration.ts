// Loci — Locus reconciliation transform (pure, no I/O).
//
// Brings the Locus tree into its invariant state, without moving or mutating any
// row destructively:
//
//   **Every live child Room has exactly one live Room card, on its parent.**
//
// It therefore: ensures one Locus root per owner, re-parents unattached maps under
// it, and adds / revives / tombstones Room cards so the invariant holds.
//
// This is a *planner*: it reads the current rows and returns the writes to apply.
// Keeping it pure makes the invariants and idempotency unit-testable off a browser
// and lets both callers — the Dexie `.upgrade()` and the runtime reconciliation in
// `mapsRepository.syncLocusRooms` — stay thin wrappers over one set of rules.
//
// Root identity is deliberately owner-independent: the root is found by the
// `isRoot` flag, and its `id` is an ordinary unique id — never derived from
// `ownerId`. A future local→authenticated claim (Backend Spike §5.1) rewrites the
// `ownerId` field on rows but preserves their `id`, so nothing here is re-keyed.
// The planner never deletes or merges a second `isRoot` map: if an owner somehow
// has two (the future L7 multi-device claim edge case), the earliest is canonical
// and the extra is left untouched for L7 to reconcile.

import type { KindleMap } from '../types/map';
import type { CanvasNodeData } from '../types/canvas';

export type LocusMigrationPlan = {
  /** Locus roots to create (owners that had maps but no root yet). */
  rootsToAdd: KindleMap[];
  /** Maps to attach under a live parent. */
  mapsToReparent: { id: string; parentId: string }[];
  /** Room cards to create for live Rooms that have none. */
  roomNodesToAdd: CanvasNodeData[];
  /**
   * Ids of tombstoned cards whose Room is still live. Revived in place — adding a
   * fresh card would collide on the deterministic id and abort the transaction,
   * and skipping it would leave a live Room with no way into it.
   */
  roomNodesToRevive: string[];
  /**
   * Ids of live cards that must not stay: they point at a Room that is gone, or
   * they are duplicates of the one card that belongs on the Room's parent.
   */
  roomNodesToTombstone: string[];
};

export type PlanLocusMigrationInput = {
  /** All rows of the `maps` table (live and tombstoned). */
  maps: KindleMap[];
  /** All `type: 'room'` canvas nodes (live and tombstoned). */
  roomNodes: CanvasNodeData[];
  /** ISO timestamp to stamp on created rows. */
  now: string;
  /** Factory for fresh, owner-independent root ids (e.g. a UUID). */
  newRootId: () => string;
  /** Display name for a newly created root. Defaults to 'My Locus'. */
  rootName?: string;
};

// Room-card grid, sized to the book card (288px) like the canvas' own
// auto-arrange, so generated cards never overlap.
const CARD_W = 288;
const CARD_H = 180;
const COL_GAP = 40;
const ROW_GAP = 40;
const ORIGIN = 60;
const COLS = 4;

function gridPosition(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return { x: ORIGIN + col * (CARD_W + COL_GAP), y: ORIGIN + row * (CARD_H + ROW_GAP) };
}

/** Deterministic card id — one Room can only ever have one card per parent. */
function cardId(parentMapId: string, roomId: string): string {
  return `${parentMapId}:room-${roomId}`;
}

/** Group key for an owner. Undefined owners bucket together (harmless — v11
 *  backfilled `ownerId` on every existing row, so in practice there is one). */
function ownerKey(ownerId: string | undefined): string {
  return ownerId ?? '';
}

export function planLocusMigration(input: PlanLocusMigrationInput): LocusMigrationPlan {
  const { maps, roomNodes, now } = input;
  const rootName = input.rootName ?? 'My Locus';

  const plan: LocusMigrationPlan = {
    rootsToAdd: [],
    mapsToReparent: [],
    roomNodesToAdd: [],
    roomNodesToRevive: [],
    roomNodesToTombstone: [],
  };

  const liveMapIds = new Set(maps.filter((m) => !m.deletedAt).map((m) => m.id));
  const cardById = new Map(roomNodes.map((n) => [n.id, n]));

  // Bucket maps by owner, splitting the (canonical) root from the children.
  const owners = new Map<string, { root?: KindleMap; children: KindleMap[] }>();
  for (const m of maps) {
    const key = ownerKey(m.ownerId);
    let bucket = owners.get(key);
    if (!bucket) { bucket = { children: [] }; owners.set(key, bucket); }
    if (m.isRoot) {
      if (!bucket.root || m.createdAt < bucket.root.createdAt) bucket.root = m;
    } else {
      bucket.children.push(m);
    }
  }

  // Cards that survive this pass, so the sweep below can tombstone the rest.
  const keptCardIds = new Set<string>();

  for (const [key, bucket] of owners) {
    const ownerId = key === '' ? undefined : key;

    let rootId: string;
    if (bucket.root) {
      rootId = bucket.root.id;
    } else {
      if (bucket.children.length === 0) continue;
      rootId = input.newRootId();
      plan.rootsToAdd.push({ id: rootId, name: rootName, isRoot: true, createdAt: now, updatedAt: now, ownerId });
      liveMapIds.add(rootId);
    }

    // How many live cards each parent already holds — new cards continue the grid.
    const usedSlots = new Map<string, number>();
    for (const n of roomNodes) {
      if (!n.deletedAt && n.roomId) usedSlots.set(n.mapId, (usedSlots.get(n.mapId) ?? 0) + 1);
    }

    for (const child of bucket.children) {
      // A Room whose parent is gone would be unreachable — re-home it on the root.
      const parentIsLive = !!child.parentId && liveMapIds.has(child.parentId);
      const parentId = parentIsLive ? child.parentId! : rootId;
      if (child.parentId !== parentId) plan.mapsToReparent.push({ id: child.id, parentId });

      // A tombstoned Room keeps no card (the sweep below removes any it still has).
      if (child.deletedAt) continue;

      const wanted = cardId(parentId, child.id);
      const liveForRoom = roomNodes.filter((n) => n.roomId === child.id && !n.deletedAt);
      const correct = liveForRoom.find((n) => n.id === wanted);

      if (correct) {
        keptCardIds.add(correct.id);
      } else if (cardById.has(wanted)) {
        // The row exists but was tombstoned while the Room stayed live: revive it
        // rather than bulkAdd a duplicate id (which would abort the transaction).
        plan.roomNodesToRevive.push(wanted);
        keptCardIds.add(wanted);
      } else {
        const slot = usedSlots.get(parentId) ?? 0;
        usedSlots.set(parentId, slot + 1);
        plan.roomNodesToAdd.push({
          id: wanted,
          mapId: parentId,
          type: 'room',
          roomId: child.id,
          content: child.name,
          position: gridPosition(slot),
          updatedAt: now,
          ownerId,
        });
        keptCardIds.add(wanted);
      }
    }
  }

  // Sweep: any live card that isn't the one card we kept must go — it either
  // points at a Room that no longer exists, or duplicates the Room's real card.
  for (const n of roomNodes) {
    if (n.deletedAt) continue;
    if (keptCardIds.has(n.id)) continue;
    plan.roomNodesToTombstone.push(n.id);
  }

  return plan;
}
