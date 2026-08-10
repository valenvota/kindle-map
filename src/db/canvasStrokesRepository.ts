import { db } from './db';
import { notDeleted } from './softDelete';
import type { CanvasStroke } from '../types/canvas';

export async function getStrokesByMap(mapId: string): Promise<CanvasStroke[]> {
  return db.canvasStrokes.where('mapId').equals(mapId).and(notDeleted).toArray();
}

/** Live stroke count across all maps (excludes tombstones). */
export async function countStrokes(): Promise<number> {
  return db.canvasStrokes.filter(notDeleted).count();
}

export async function addStroke(stroke: CanvasStroke): Promise<void> {
  await db.canvasStrokes.put(stroke);
}

export async function deleteStroke(id: string): Promise<void> {
  await db.canvasStrokes.update(id, { deletedAt: new Date().toISOString() });
}

export async function deleteAllStrokesByMap(mapId: string): Promise<void> {
  const deletedAt = new Date().toISOString();
  await db.canvasStrokes.where('mapId').equals(mapId).and(notDeleted).modify({ deletedAt });
}
