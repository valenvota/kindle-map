import { db } from './db';
import { notDeleted } from './softDelete';
import { planLocusMigration, cardId } from './locusMigration';
import type { KindleMap, MapBackground } from '../types/map';
import type { CanvasNodeData } from '../types/canvas';

export async function createMap(name: string): Promise<KindleMap> {
  const now = new Date().toISOString();
  const map: KindleMap = {
    id: `map-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
  };
  await db.maps.add(map);
  return map;
}

/**
 * Create a Room directly on the current canvas (Loci L2.1) — the child map plus
 * exactly one Room card on `parentMapId`, in one transaction, at the clicked
 * position. `parentMapId` is simply the map the user is in, so a Room created
 * from inside another Room nests naturally (its `parentId` chain extends).
 *
 * The card uses the same deterministic `cardId(parent, child)` the reconciliation
 * planner uses, so this is the *exact* row `syncLocusRooms` would produce: a later
 * reconcile treats it as the canonical card and leaves it untouched — no duplicate
 * card, no ghost. This deliberately does not re-implement adoption/reconciliation.
 *
 * The name defaults to 'Untitled Room' so a Room is never nameless (breadcrumb /
 * Desk / Maps read `maps.name`); the caller opens inline rename immediately.
 */
export async function createRoom(
  parentMapId: string,
  position: { x: number; y: number },
  name?: string,
): Promise<{ room: KindleMap; cardId: string }> {
  const now = new Date().toISOString();
  const roomName = name?.trim() || 'Untitled Room';
  const room: KindleMap = {
    id: `map-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: roomName,
    parentId: parentMapId,
    createdAt: now,
    updatedAt: now,
  };
  const cid = cardId(parentMapId, room.id);
  const card: CanvasNodeData = {
    id: cid,
    mapId: parentMapId,
    type: 'room',
    roomId: room.id,
    content: roomName,
    position,
    updatedAt: now,
  };
  await db.transaction('rw', [db.maps, db.canvasNodes], async () => {
    await db.maps.add(room);
    await db.canvasNodes.add(card);
  });
  return { room, cardId: cid };
}

/**
 * Rename a Room. `maps.name` is the single source of truth — the Room card,
 * breadcrumb, Desk and Maps all read it (the card's own `content` is a
 * non-authoritative cache), so this one write updates every surface reactively.
 * An empty name falls back to 'Untitled Room' so a Room is never nameless.
 */
export async function renameRoom(mapId: string, name: string): Promise<void> {
  await db.maps.update(mapId, { name: name.trim() || 'Untitled Room', updatedAt: new Date().toISOString() });
}

export async function getAllMaps(): Promise<KindleMap[]> {
  return db.maps.orderBy('createdAt').filter(notDeleted).toArray();
}

/**
 * Live count of user-created maps (excludes tombstones AND the Locus root). The
 * root is product infrastructure, not a Map the user made, so it must not inflate
 * the sidebar badge or falsely complete the "Create a map" onboarding step.
 */
export async function countMaps(): Promise<number> {
  return db.maps.filter((m) => notDeleted(m) && !m.isRoot).count();
}

/**
 * The Locus root (Loci L1). Identified by the explicit `isRoot` marker, never by
 * `parentId` absence (legacy/orphan maps also lack a parent) and never derived
 * from `ownerId` (a future auth claim rewrites owner but keeps ids). If more than
 * one live root exists — the deferred L7 multi-device claim edge case — the
 * earliest is returned deterministically; L7 owns reconciling the duplicate.
 * Not wired into app startup in Slice 1 (no navigation yet); used by later slices.
 */
export async function getRootMap(): Promise<KindleMap | undefined> {
  const roots = await db.maps.filter((m) => !!m.isRoot && notDeleted(m)).toArray();
  if (roots.length === 0) return undefined;
  return roots.sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
}

/**
 * Make the Locus reflect every Room that exists — creating the root if needed,
 * re-parenting any unattached map under it, and generating the missing Room
 * cards. Idempotent; returns the root.
 *
 * The v12 migration only ever sees the maps that exist at upgrade time. Maps
 * created afterwards (the sample data, or `createMap` from the Maps list) would
 * otherwise never reach the Locus: it would render empty while the rest of the
 * app still counted them as Rooms. Reuses the migration's pure planner so the
 * adoption rules — and their idempotency — live in exactly one place.
 */
export async function syncLocusRooms(): Promise<KindleMap> {
  await db.transaction('rw', [db.maps, db.canvasNodes], async () => {
    const now = new Date().toISOString();
    const maps = await db.maps.toArray();
    // Live AND tombstoned cards: the planner needs the tombstoned ones to revive
    // them in place instead of colliding on their deterministic id.
    const roomNodes = await db.canvasNodes.where('type').equals('room').toArray();
    const plan = planLocusMigration({
      maps,
      roomNodes,
      now,
      newRootId: () => `locus-${crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
    });
    for (const root of plan.rootsToAdd) await db.maps.add(root);
    for (const rp of plan.mapsToReparent) await db.maps.update(rp.id, { parentId: rp.parentId });
    if (plan.roomNodesToAdd.length > 0) await db.canvasNodes.bulkAdd(plan.roomNodesToAdd);
    for (const id of plan.roomNodesToRevive) await db.canvasNodes.update(id, { deletedAt: undefined });
    for (const id of plan.roomNodesToTombstone) await db.canvasNodes.update(id, { deletedAt: now });
  });
  // The planner creates a root when an owner has maps but none; ensureLocusRoot
  // covers the remaining case of a brand-new install with no maps at all.
  return ensureLocusRoot();
}

/**
 * Get-or-create the Locus root (idempotent). Covers the fresh-install path where
 * the v12 `.upgrade()` never runs (a new DB opens straight at v12).
 *
 * The get-and-create runs inside a single `rw` transaction on `maps`: Dexie
 * serializes transactions that share a table, so concurrent callers — notably
 * React StrictMode's double-invoked startup effect in dev — can't race two roots
 * into existence; the second caller runs after the first commits and sees its
 * root. (getRootMap here executes within this transaction's Dexie zone.)
 */
export async function ensureLocusRoot(): Promise<KindleMap> {
  return db.transaction('rw', db.maps, async () => {
    const existing = await getRootMap();
    if (existing) return existing;
    const now = new Date().toISOString();
    const uuid = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const root: KindleMap = {
      id: `locus-${uuid}`,
      name: 'My Locus',
      isRoot: true,
      createdAt: now,
      updatedAt: now,
    };
    await db.maps.add(root);
    return root;
  });
}

/**
 * The chain of maps from the Locus root down to `mapId`, inclusive
 * (`[root, …, current]`), by walking `parentId` upward. Drives the breadcrumb.
 * A `seen` guard makes a malformed parent cycle terminate instead of hanging.
 * Tombstoned ancestors read as absent (getMap filters them), so the chain stops.
 */
export async function getMapAncestry(mapId: string): Promise<KindleMap[]> {
  const chain: KindleMap[] = [];
  const seen = new Set<string>();
  let cur = await getMap(mapId);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.unshift(cur);
    cur = cur.parentId ? await getMap(cur.parentId) : undefined;
  }
  return chain;
}

export type RecentRoom = {
  /** The Room's own map id — pass to `goToMap` / `onOpenMap` to enter it. */
  id: string;
  name: string;
  /** Live nodes inside the Room (tombstones excluded). */
  nodeCount: number;
  /** ISO timestamp of the Room's most recent node activity. */
  lastActivity: string;
};

/**
 * Rooms ordered by real activity, most recent first (Desk — Loci L1).
 *
 * Recency deliberately comes from the Room's **contents**, not from
 * `maps.updatedAt`: that field only moves when the map row itself changes
 * (rename, wallpaper, tombstone), so a Room you edited all afternoon would look
 * stale. We walk `canvasNodes` newest-first on the `updatedAt` index and stop as
 * soon as `limit` distinct live Rooms have been seen, so a large library is not
 * fully scanned.
 *
 * Excludes tombstoned nodes, tombstoned maps, and the **Locus root** (it is the
 * container for Rooms, not a Room). A Room with no live nodes has no activity and
 * therefore does not appear — intentional for a "recent activity" surface.
 */
export async function getRecentRooms(limit = 5): Promise<RecentRoom[]> {
  const rooms = await db.maps.filter((m) => notDeleted(m) && !m.isRoot).toArray();
  if (rooms.length === 0) return [];
  const byId = new Map(rooms.map((m) => [m.id, m]));

  // First sighting of a mapId while walking newest-first IS its last activity.
  const lastActivity = new Map<string, string>();
  await db.canvasNodes
    .orderBy('updatedAt')
    .reverse()
    .until(() => lastActivity.size >= limit)
    .each((n) => {
      if (!notDeleted(n) || lastActivity.has(n.mapId) || !byId.has(n.mapId)) return;
      lastActivity.set(n.mapId, n.updatedAt ?? '');
    });

  const ordered = [...lastActivity.entries()].sort((a, b) => b[1].localeCompare(a[1]));
  const recent: RecentRoom[] = [];
  for (const [mapId, last] of ordered) {
    const nodeCount = await db.canvasNodes.where('mapId').equals(mapId).and(notDeleted).count();
    recent.push({ id: mapId, name: byId.get(mapId)!.name, nodeCount, lastActivity: last });
  }
  return recent;
}

export async function getMap(id: string): Promise<KindleMap | undefined> {
  // Display read — a tombstoned map reads as absent.
  const map = await db.maps.get(id);
  return map && notDeleted(map) ? map : undefined;
}

/** Set a map's wallpaper preset (Sprint 4). */
export async function updateMapBackground(id: string, background: MapBackground): Promise<void> {
  await db.maps.update(id, { background, updatedAt: new Date().toISOString() });
}

/**
 * Delete a Room and everything it owns (Loci L2.0) — the single deletion path.
 *
 * "Card = Room": there is no valid state where a Room stays alive while the card
 * that leads to it is gone, so this tombstones the Room, its whole subtree, every
 * entity those maps own, and the cards pointing into them (including the one on
 * the parent). Soft-delete throughout, per the Backend Spike — nothing is erased.
 *
 * Map-owned entities are `canvasNodes`, `canvasEdges` and `canvasStrokes`; all
 * three are cascaded, so a delete cannot silently leave edges or ink behind.
 * Books, highlights and notes are deliberately untouched — they belong to the
 * Library, not to a Room. The Locus root is never deletable.
 */
export async function deleteRoom(mapId: string): Promise<void> {
  const deletedAt = new Date().toISOString();
  await db.transaction('rw', [db.maps, db.canvasNodes, db.canvasEdges, db.canvasStrokes], async () => {
    const all = await db.maps.toArray();
    const target = all.find((m) => m.id === mapId);
    if (!target || target.isRoot) return;   // never delete the Locus itself

    const childrenOf = new Map<string, string[]>();
    for (const m of all) {
      if (!m.parentId) continue;
      const list = childrenOf.get(m.parentId);
      if (list) list.push(m.id); else childrenOf.set(m.parentId, [m.id]);
    }

    // Walk the subtree downward; `seen` also guards a malformed parent cycle.
    const seen = new Set<string>();
    const queue = [mapId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const child of childrenOf.get(id) ?? []) queue.push(child);
    }
    const subtree = [...seen];

    await db.maps.where('id').anyOf(subtree).modify({ deletedAt });
    await db.canvasNodes.where('mapId').anyOf(subtree).modify({ deletedAt });
    await db.canvasEdges.where('mapId').anyOf(subtree).modify({ deletedAt });
    await db.canvasStrokes.where('mapId').anyOf(subtree).modify({ deletedAt });

    // The cards that lead into the subtree — the parent's card included.
    await db.canvasNodes.where('type').equals('room').modify((n) => {
      if (n.roomId && seen.has(n.roomId) && !n.deletedAt) n.deletedAt = deletedAt;
    });
  });
}

/**
 * @deprecated Use `deleteRoom`. Kept so the legacy Maps list deletes a map through
 * exactly the same path as deleting a Room from the Locus, leaving one consistent
 * end state regardless of which surface the user came from.
 */
export async function deleteMap(id: string): Promise<void> {
  return deleteRoom(id);
}
