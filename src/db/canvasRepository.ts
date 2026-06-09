import { db } from './db';
import type { CanvasNodeData } from '../types/canvas';

export async function upsertCanvasNode(node: CanvasNodeData): Promise<void> {
  await db.canvasNodes.put(node);
}

export async function getCanvasNodesByMap(mapId: string): Promise<CanvasNodeData[]> {
  return db.canvasNodes.where('mapId').equals(mapId).toArray();
}

export async function deleteCanvasNode(id: string): Promise<void> {
  await db.canvasNodes.delete(id);
}

/** @deprecated use getCanvasNodesByMap */
export async function getAllCanvasNodes(): Promise<CanvasNodeData[]> {
  return db.canvasNodes.toArray();
}
