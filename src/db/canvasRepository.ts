import { db } from './db';
import type { CanvasNodeData } from '../types/canvas';

export async function upsertCanvasNode(node: CanvasNodeData): Promise<void> {
  await db.canvasNodes.put(node);
}

export async function getAllCanvasNodes(): Promise<CanvasNodeData[]> {
  return db.canvasNodes.toArray();
}

export async function getCanvasNodeByBook(bookId: string): Promise<CanvasNodeData | undefined> {
  return db.canvasNodes.where('bookId').equals(bookId).first();
}
