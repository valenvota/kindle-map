import { db } from './db';
import type { KindleMap } from '../types/map';

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
  return db.maps.orderBy('createdAt').toArray();
}

export async function getMap(id: string): Promise<KindleMap | undefined> {
  return db.maps.get(id);
}

export async function deleteMap(id: string): Promise<void> {
  // Deletes the map and all its canvas nodes.
  // Books and highlights are intentionally NOT deleted — they belong to the Library.
  await db.transaction('rw', db.maps, db.canvasNodes, async () => {
    await db.maps.delete(id);
    await db.canvasNodes.where('mapId').equals(id).delete();
  });
}
