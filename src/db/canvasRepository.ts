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

export async function updateCanvasNodeContent(id: string, content: string): Promise<void> {
  await db.canvasNodes.update(id, { content });
}

export async function updateCanvasNodeStyle(
  id: string,
  style: CanvasNodeData['style'],
): Promise<void> {
  await db.canvasNodes.update(id, { style });
}

export async function updateCanvasNodePosition(
  id: string,
  position: { x: number; y: number },
): Promise<void> {
  await db.canvasNodes.update(id, { position });
}

/** @deprecated use getCanvasNodesByMap */
export async function getAllCanvasNodes(): Promise<CanvasNodeData[]> {
  return db.canvasNodes.toArray();
}
