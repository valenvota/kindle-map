import { db } from './db';
import type { CanvasNodeData, CanvasEdge } from '../types/canvas';

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

export async function updateCanvasNodeSize(
  id: string,
  width: number,
  height: number,
): Promise<void> {
  await db.canvasNodes.update(id, { width, height });
}

// ─── Edges ──────────────────────────────────────────────────────────────────

export async function getCanvasEdgesByMap(mapId: string): Promise<CanvasEdge[]> {
  return db.canvasEdges.where('mapId').equals(mapId).toArray();
}

export async function addCanvasEdge(edge: CanvasEdge): Promise<void> {
  await db.canvasEdges.put(edge);
}

export async function deleteCanvasEdge(id: string): Promise<void> {
  await db.canvasEdges.delete(id);
}

export async function updateCanvasEdgeDirection(id: string, direction: import('../types/canvas').EdgeDirection): Promise<void> {
  await db.canvasEdges.update(id, { direction });
}

/** @deprecated use getCanvasNodesByMap */
export async function getAllCanvasNodes(): Promise<CanvasNodeData[]> {
  return db.canvasNodes.toArray();
}
