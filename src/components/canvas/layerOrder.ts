import type { CanvasNodeData } from '../../types/canvas';

/**
 * Canvas stacking order — pure helpers, no React and no Dexie.
 *
 * Every node's effective z comes from `resolveZ`. Nodes persisted before the
 * zIndex field existed have none, so absence resolves by type: shapes sit
 * behind everything else, because a big rectangle or circle is almost always
 * a backdrop / region / container rather than something meant to cover books.
 * That makes legacy maps stack correctly with no migration and no user action.
 */

/** Default z for shape nodes — behind. */
export const SHAPE_Z = 0;
/** Default z for every other node type — in front of shapes. */
export const DEFAULT_Z = 1;

export function resolveZ(node: Pick<CanvasNodeData, 'type' | 'zIndex'>): number {
  if (node.zIndex !== undefined) return node.zIndex;
  return node.type === 'shape' ? SHAPE_Z : DEFAULT_Z;
}

export type LayerOp = 'front' | 'back' | 'forward' | 'backward';
export type OrderableNode = Pick<CanvasNodeData, 'id' | 'type' | 'zIndex'>;

/**
 * Nodes bottom → top. Ties break by array (creation) order, so the result is
 * deterministic even when every node resolves to the same z, as legacy maps do.
 */
export function visualOrder<T extends OrderableNode>(nodes: T[]): T[] {
  return nodes
    .map((node, i) => ({ node, i }))
    .sort((a, b) => resolveZ(a.node) - resolveZ(b.node) || a.i - b.i)
    .map((x) => x.node);
}

/** Where the selected block lands in `rest`, or null if the op is a no-op. */
function insertionIndex(
  order: OrderableNode[],
  rest: OrderableNode[],
  selectedIds: Set<string>,
  op: LayerOp,
): number | null {
  if (op === 'front') return rest.length;
  if (op === 'back') return 0;

  const selectedIdx = order.reduce<number[]>((acc, n, i) => {
    if (selectedIds.has(n.id)) acc.push(i);
    return acc;
  }, []);

  if (op === 'forward') {
    // Hop the block over the nearest unselected node above it.
    const top = selectedIdx[selectedIdx.length - 1];
    const above = order.findIndex((n, i) => i > top && !selectedIds.has(n.id));
    if (above === -1) return null; // already at the front
    return rest.indexOf(order[above]) + 1;
  }

  // backward — hop over the nearest unselected node below.
  for (let i = selectedIdx[0] - 1; i >= 0; i--) {
    if (!selectedIds.has(order[i].id)) return rest.indexOf(order[i]);
  }
  return null; // already at the back
}

/**
 * Re-stack `selectedIds` by `op`, returning only the nodes whose z must change.
 *
 * Every op re-densifies the map to 0..n-1. Legacy nodes all resolve to the same
 * z, so without that "bring forward" would have no defined meaning; afterwards
 * every node owns an unambiguous slot. A multi-selection moves as one block and
 * keeps its internal order.
 */
export function applyLayerOp(
  nodes: OrderableNode[],
  selectedIds: Set<string>,
  op: LayerOp,
): { id: string; zIndex: number }[] {
  const order = visualOrder(nodes);
  const selected = order.filter((n) => selectedIds.has(n.id));
  const rest = order.filter((n) => !selectedIds.has(n.id));
  if (selected.length === 0 || rest.length === 0) return [];

  const at = insertionIndex(order, rest, selectedIds, op);
  if (at === null) return [];

  const next = [...rest.slice(0, at), ...selected, ...rest.slice(at)];
  const changes: { id: string; zIndex: number }[] = [];
  next.forEach((n, z) => {
    if (resolveZ(n) !== z) changes.push({ id: n.id, zIndex: z });
  });
  return changes;
}
