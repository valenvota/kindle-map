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
