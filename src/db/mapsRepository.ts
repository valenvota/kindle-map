import { db } from './db';
import { notDeleted } from './softDelete';
import type { KindleMap, MapBackground } from '../types/map';

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

export async function getAllMaps(): Promise<KindleMap[]> {
  return db.maps.orderBy('createdAt').filter(notDeleted).toArray();
}

/** Live map count (excludes tombstones). */
export async function countMaps(): Promise<number> {
  return db.maps.filter(notDeleted).count();
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
 * Get-or-create the Locus root (idempotent). Covers the fresh-install path where
 * the v12 `.upgrade()` never runs (a new DB opens straight at v12). Deliberately
 * not called at startup yet — that wiring lands with the navigation slice.
 */
export async function ensureLocusRoot(): Promise<KindleMap> {
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

export async function getMap(id: string): Promise<KindleMap | undefined> {
  // Display read — a tombstoned map reads as absent.
  const map = await db.maps.get(id);
  return map && notDeleted(map) ? map : undefined;
}

/** Set a map's wallpaper preset (Sprint 4). */
export async function updateMapBackground(id: string, background: MapBackground): Promise<void> {
  await db.maps.update(id, { background, updatedAt: new Date().toISOString() });
}

export async function deleteMap(id: string): Promise<void> {
  // Soft delete (tombstone) the map and all its canvas nodes.
  // Books and highlights are intentionally NOT deleted — they belong to the Library.
  // (Edges/strokes of this map are left as-is, matching prior behaviour — they
  // simply stop rendering with the map gone; a pre-existing orphan, tracked separately.)
  const deletedAt = new Date().toISOString();
  await db.transaction('rw', db.maps, db.canvasNodes, async () => {
    await db.maps.update(id, { deletedAt });
    await db.canvasNodes.where('mapId').equals(id).modify({ deletedAt });
  });
}
