import { db } from './db';
import type { CanvasStroke } from '../types/canvas';

export async function getStrokesByMap(mapId: string): Promise<CanvasStroke[]> {
  return db.canvasStrokes.where('mapId').equals(mapId).toArray();
}

export async function addStroke(stroke: CanvasStroke): Promise<void> {
  await db.canvasStrokes.put(stroke);
}

export async function deleteStroke(id: string): Promise<void> {
  await db.canvasStrokes.delete(id);
}

export async function deleteAllStrokesByMap(mapId: string): Promise<void> {
  const ids = (await db.canvasStrokes.where('mapId').equals(mapId).toArray()).map((s) => s.id);
  await db.canvasStrokes.bulkDelete(ids);
}
