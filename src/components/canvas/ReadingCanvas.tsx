import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { exportMapAsPng } from '../../utils/exportMapImage';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeMouseHandler,
  type OnSelectionChangeFunc,
  BackgroundVariant,
} from '@xyflow/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  updateCanvasNodePosition,
  deleteCanvasNode,
  upsertCanvasNode,
  getCanvasEdgesByMap,
  addCanvasEdge,
  deleteCanvasEdge,
  updateCanvasEdgeDirection,
  updateCanvasEdgeLabel,
} from '../../db/canvasRepository';
import type { EdgeDirection } from '../../types/canvas';
import { BookNode, type BookNodeData } from './BookNode';
import { LabeledEdge } from './LabeledEdge';
import { TopicNode, type TopicNodeData } from './nodes/TopicNode';
import { NoteNode, type NoteNodeData } from './nodes/NoteNode';
import { QuoteNode, type QuoteNodeData } from './nodes/QuoteNode';
import { ShapeNode, type ShapeNodeData } from './nodes/ShapeNode';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasLeftToolbar } from './CanvasLeftToolbar';
import { PlusMenu } from './PlusMenu';
import { NodeStyleToolbar } from './NodeStyleToolbar';
import { CanvasToolContext, type CanvasTool } from './CanvasToolContext';
import { DrawingLayer } from './DrawingLayer';
import type { Book } from '../../types/book';
import type { CanvasNodeData, StrokeTool } from '../../types/canvas';

const STYLEABLE_TYPES = new Set(['topic', 'note', 'quote', 'shape']);

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_WIDTH = 208;
const NODE_HEIGHT = 180;
const GRID_COL_GAP = 40;
const GRID_ROW_GAP = 40;
const COLS = 4;

// Must be defined outside component to be stable across renders
const nodeTypes = {
  book: BookNode,
  topic: TopicNode,
  note: NoteNode,
  quote: QuoteNode,
  shape: ShapeNode,
};

const edgeTypes = {
  labeled: LabeledEdge,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ARROW = { type: MarkerType.ArrowClosed, color: '#94a3b8' };

function edgeMarkersForDirection(dir: EdgeDirection = 'forward') {
  return {
    markerEnd:   (dir === 'forward'  || dir === 'both') ? ARROW : undefined,
    markerStart: (dir === 'backward' || dir === 'both') ? ARROW : undefined,
  };
}

function buildInitialPosition(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    x: 60 + col * (NODE_WIDTH + GRID_COL_GAP),
    y: 60 + row * (NODE_HEIGHT + GRID_ROW_GAP),
  };
}

function buildReactFlowNode(
  mn: CanvasNodeData,
  bookMap: Map<string, Book>,
): Node | null {
  const base = { id: mn.id, position: mn.position };

  switch (mn.type) {
    case 'book': {
      const book = bookMap.get(mn.bookId ?? '');
      if (!book) return null;
      return { ...base, type: 'book', data: { book } satisfies BookNodeData };
    }
    case 'topic':
      return {
        ...base,
        type: 'topic',
        data: { nodeId: mn.id, content: mn.content ?? '', style: mn.style } satisfies TopicNodeData,
      };
    case 'note':
      return {
        ...base,
        type: 'note',
        data: { nodeId: mn.id, content: mn.content ?? '', style: mn.style } satisfies NoteNodeData,
      };
    case 'quote': {
      const book = bookMap.get(mn.bookId ?? '');
      return {
        ...base,
        type: 'quote',
        data: {
          nodeId: mn.id,
          content: mn.content ?? '',
          bookTitle: book?.title ?? '(deleted book)',
          bookId: mn.bookId ?? '',
          highlightId: mn.highlightId ?? '',
          style: mn.style,
        } satisfies QuoteNodeData,
      };
    }
    case 'shape':
      return {
        ...base,
        type: 'shape',
        width: mn.width ?? 160,
        height: mn.height ?? 100,
        style: { width: mn.width ?? 160, height: mn.height ?? 100 },
        data: {
          nodeId: mn.id,
          shapeKind: mn.shapeKind ?? 'rectangle',
          style: mn.style,
        } satisfies ShapeNodeData,
      };
    default:
      return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  mapId: string;
  onBack: () => void;    // → Maps list
  onLibrary: () => void; // → Library
  onOpenBook: (bookId: string) => void;
};

export function ReadingCanvas({ mapId, onBack, onLibrary, onOpenBook }: Props) {
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [drawColor, setDrawColor] = useState('#1c1917');
  const [drawWidth, setDrawWidth] = useState(3);
  const [editingLabelEdgeId, setEditingLabelEdgeId] = useState<string | null>(null);
  const [editingLabelText, setEditingLabelText] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<Record<string, any>>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const initialized = useRef(false);
  const edgesInitialized = useRef(false);
  const prevMapIdRef = useRef(mapId);

  // ── Undo/Redo history ─────────────────────────────────────────────────────
  const historyStack = useRef<import('../../types/canvas').CanvasNodeData[][]>([]);
  const historyIndex = useRef(-1);
  const isRestoring = useRef(false);

  // Live queries
  const mapNodes = useLiveQuery(
    () => db.canvasNodes.where('mapId').equals(mapId).toArray(),
    [mapId],
  );
  const allBooks = useLiveQuery(() => db.books.toArray(), []);
  const map = useLiveQuery(() => db.maps.get(mapId), [mapId]);

  // Reset state when switching between maps
  useEffect(() => {
    if (prevMapIdRef.current !== mapId) {
      initialized.current = false;
      edgesInitialized.current = false;
      historyStack.current = [];
      historyIndex.current = -1;
      setNodes([]);
      setEdges([]);
      prevMapIdRef.current = mapId;
    }
  }, [mapId]);

  // ── Capture history snapshot when mapNodes changes (debounced 400ms) ──────
  useEffect(() => {
    if (!mapNodes || !initialized.current || isRestoring.current) return;
    const timer = setTimeout(() => {
      if (isRestoring.current) return;
      const snapshot = mapNodes.map((n) => ({ ...n }));
      // Trim any redo future when a new action occurs
      historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
      historyStack.current.push(snapshot);
      historyIndex.current = historyStack.current.length - 1;
    }, 400);
    return () => clearTimeout(timer);
  }, [mapNodes]);

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z';
      const isRedo = (e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'));
      if (!isUndo && !isRedo) return;
      e.preventDefault();

      const newIndex = isUndo ? historyIndex.current - 1 : historyIndex.current + 1;
      if (newIndex < 0 || newIndex >= historyStack.current.length) return;

      historyIndex.current = newIndex;
      const snapshot = historyStack.current[newIndex];
      isRestoring.current = true;

      const current = await db.canvasNodes.where('mapId').equals(mapId).toArray();
      await db.canvasNodes.bulkDelete(current.map((n) => n.id));
      if (snapshot.length > 0) await db.canvasNodes.bulkPut(snapshot);

      setTimeout(() => { isRestoring.current = false; }, 600);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mapId]);

  // ── Load edges from Dexie once per map ───────────────────────────────────
  useEffect(() => {
    if (edgesInitialized.current) return;
    edgesInitialized.current = true;
    getCanvasEdgesByMap(mapId).then((dbEdges) => {
      setEdges(dbEdges.map((e) => ({
        id: e.id,
        type: 'labeled',
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
        targetHandle: e.targetHandle ?? null,
        data: { label: e.label ?? '' },
        style: { stroke: '#94a3b8', strokeWidth: 2, fill: 'none' },
        ...edgeMarkersForDirection(e.direction),
      })));
    });
  }, [mapId]);

  // ── Initialize nodes from Dexie once ────────────────────────────────────
  useEffect(() => {
    if (!mapNodes || !allBooks || initialized.current) return;

    const bookMap = new Map(allBooks.map((b) => [b.id, b]));
    const initial = mapNodes
      .map((mn) => buildReactFlowNode(mn, bookMap))
      .filter((n): n is Node => n !== null);

    setNodes(initial);
    initialized.current = true;
  }, [mapNodes, allBooks]);

  // ── Sync additions and deletions from Dexie without resetting layout ─────
  useEffect(() => {
    if (!initialized.current || !mapNodes || !allBooks) return;

    const mapNodeIds = new Set(mapNodes.map((mn) => mn.id));
    const bookMap = new Map(allBooks.map((b) => [b.id, b]));

    setNodes((prev) => {
      // Remove nodes deleted from Dexie
      const remaining = prev.filter((n) => mapNodeIds.has(n.id));
      // Add nodes not yet in React Flow state
      const existingIds = new Set(remaining.map((n) => n.id));
      const newMapNodes = mapNodes.filter((mn) => !existingIds.has(mn.id));

      if (newMapNodes.length === 0 && remaining.length === prev.length) return prev;

      const newNodes = newMapNodes
        .map((mn, i) => {
          const withPosition = {
            ...mn,
            position: mn.position ?? buildInitialPosition(remaining.length + i),
          };
          return buildReactFlowNode(withPosition, bookMap);
        })
        .filter((n): n is Node => n !== null);

      return [...remaining, ...newNodes];
    });
  }, [mapNodes, allBooks]);

  // ── Sync style overrides from Dexie into existing nodes ──────────────────
  useEffect(() => {
    if (!initialized.current || !mapNodes) return;

    const styleById = new Map(mapNodes.map((mn) => [mn.id, mn.style]));
    setNodes((prev) => {
      let changed = false;
      const next = prev.map((n) => {
        if (!STYLEABLE_TYPES.has(n.type ?? '')) return n;
        const newStyle = styleById.get(n.id);
        if (JSON.stringify(newStyle) === JSON.stringify((n.data as { style?: unknown }).style)) return n;
        changed = true;
        return { ...n, data: { ...n.data, style: newStyle } };
      });
      return changed ? next : prev;
    });
  }, [mapNodes]);

  // ── Track selected node + edge for toolbars ──────────────────────────────
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const onSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: selNodes, edges: selEdges }) => {
    setSelectedNodeId(selNodes.length === 1 ? selNodes[0].id : null);
    setSelectedEdgeId(selEdges.length === 1 ? selEdges[0].id : null);
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const showStyleToolbar = selectedNode && STYLEABLE_TYPES.has(selectedNode.type ?? '');

  const handleEdgeDirectionChange = useCallback(async (dir: EdgeDirection) => {
    if (!selectedEdgeId) return;
    await updateCanvasEdgeDirection(selectedEdgeId, dir);
    setEdges((prev) => prev.map((e) =>
      e.id === selectedEdgeId
        ? { ...e, ...edgeMarkersForDirection(dir) }
        : e,
    ));
  }, [selectedEdgeId, setEdges]);

  // ── Persist position on drag stop — all selected nodes move together ────
  const onNodeDragStop = useCallback(async (_: unknown, node: Node) => {
    const moved = nodes.filter((n) => n.selected || n.id === node.id);
    await Promise.all(moved.map((n) => updateCanvasNodePosition(n.id, n.position)));
  }, [nodes]);

  // ── Double-click book node → open detail drawer ──────────────────────────
  const onNodeDoubleClick: NodeMouseHandler = useCallback((_, node) => {
    if (node.type !== 'book') return;
    const book = (node.data as BookNodeData).book;
    onOpenBook(book.id);
  }, [onOpenBook]);

  // ── Auto arrange ─────────────────────────────────────────────────────────
  const handleAutoArrange = useCallback(async () => {
    const arranged = nodes.map((node, i) => ({
      ...node,
      position: buildInitialPosition(i),
    }));
    setNodes(arranged);
    await Promise.all(
      arranged.map((node) => updateCanvasNodePosition(node.id, node.position)),
    );
  }, [nodes, setNodes]);

  // ── Derived state for PlusMenu ────────────────────────────────────────────
  const existingBookIds = useMemo(
    () =>
      new Set(
        nodes
          .filter((n) => n.type === 'book')
          .map((n) => (n.data as BookNodeData).book.id),
      ),
    [nodes],
  );

  const panMode = activeTool === 'pan';

  // ── Create edge on connect ────────────────────────────────────────────────
  const onConnect = useCallback(async (connection: Connection) => {
    const newEdge: Edge = {
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      type: 'labeled',
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      data: { label: '' },
      style: { stroke: '#94a3b8', strokeWidth: 2, fill: 'none' },
      ...edgeMarkersForDirection('forward'),
    };
    setEdges((eds) => addEdge(newEdge, eds));
    await addCanvasEdge({
      id: newEdge.id,
      mapId,
      source: newEdge.source,
      target: newEdge.target,
      sourceHandle: newEdge.sourceHandle,
      targetHandle: newEdge.targetHandle,
      direction: 'forward',
      createdAt: new Date().toISOString(),
    });
  }, [mapId, setEdges]);

  // ── Delete nodes ──────────────────────────────────────────────────────────
  const onNodesDelete = useCallback(async (deletedNodes: Node[]) => {
    await Promise.all(deletedNodes.map((n) => deleteCanvasNode(n.id)));
  }, []);

  // ── Duplicate selected nodes (Ctrl+D) ────────────────────────────────────
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'd') return;
      e.preventDefault();
      const selected = nodes.filter((n) => n.selected);
      if (selected.length === 0 || !mapNodes) return;
      const dbById = new Map(mapNodes.map((mn) => [mn.id, mn]));
      await Promise.all(
        selected.map((n) => {
          const original = dbById.get(n.id);
          if (!original) return Promise.resolve();
          const clone = {
            ...original,
            id: `${original.id}-copy-${Date.now()}`,
            position: { x: n.position.x + 30, y: n.position.y + 30 },
          };
          return upsertCanvasNode(clone);
        }),
      );
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nodes, mapNodes]);

  // ── Delete edges ──────────────────────────────────────────────────────────
  const onEdgesDelete = useCallback(async (deletedEdges: Edge[]) => {
    await Promise.all(deletedEdges.map((e) => deleteCanvasEdge(e.id)));
  }, []);

  // ── Edge label editing ────────────────────────────────────────────────────
  const onEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const current = (edge.data as { label?: string })?.label ?? '';
    setEditingLabelEdgeId(edge.id);
    setEditingLabelText(current);
  }, []);

  const saveLabelEdit = useCallback(async () => {
    if (!editingLabelEdgeId) return;
    const id = editingLabelEdgeId;
    const text = editingLabelText.trim();
    setEditingLabelEdgeId(null);
    await updateCanvasEdgeLabel(id, text);
    setEdges((prev) => prev.map((e) =>
      e.id === id ? { ...e, data: { ...(e.data ?? {}), label: text } } : e,
    ));
  }, [editingLabelEdgeId, editingLabelText, setEdges]);

  // ── Context menu ─────────────────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  const onNodeContextMenu: NodeMouseHandler = useCallback((e, node) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleContextDuplicate = useCallback(async () => {
    if (!contextMenu || !mapNodes) return;
    closeContextMenu();
    const original = mapNodes.find((mn) => mn.id === contextMenu.nodeId);
    if (!original) return;
    await upsertCanvasNode({
      ...original,
      id: `${original.id}-copy-${Date.now()}`,
      position: { x: original.position.x + 30, y: original.position.y + 30 },
    });
  }, [contextMenu, mapNodes, closeContextMenu]);

  const handleContextDelete = useCallback(async () => {
    if (!contextMenu) return;
    const nodeId = contextMenu.nodeId;
    closeContextMenu();
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    await deleteCanvasNode(nodeId);
  }, [contextMenu, closeContextMenu, setNodes]);

  // ── Export map as PNG ─────────────────────────────────────────────────────
  const [exportingImage, setExportingImage] = useState(false);
  const handleExportImage = useCallback(async () => {
    if (nodes.length === 0) return;
    setExportingImage(true);
    try {
      await exportMapAsPng(nodes, map?.name ?? 'map');
    } finally {
      setExportingImage(false);
    }
  }, [nodes, map?.name]);

  return (
    <CanvasToolContext.Provider value={{ activeTool, setActiveTool }}>
    <div className="relative h-screen w-full bg-stone-50">
      <CanvasToolbar
        mapName={map?.name ?? '…'}
        onBack={onBack}
        onLibrary={onLibrary}
        onAutoArrange={handleAutoArrange}
        onExportImage={handleExportImage}
        exportingImage={exportingImage}
      />

      <CanvasLeftToolbar />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={closeContextMenu}
        onSelectionChange={onSelectionChange}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode="Backspace"
        selectionKeyCode={null}
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        selectionOnDrag={!panMode}
        panOnScroll
        panOnDrag={panMode ? [0, 1, 2] : [1, 2]}
        zoomOnScroll={false}
        zoomOnPinch
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#d6d3d1"
        />
        <Controls
          position="bottom-right"
          showInteractive={false}
          style={{ bottom: '24px', right: '24px' }}
        />
        <DrawingLayer
          mapId={mapId}
          tool={(['pencil', 'marker', 'eraser'] as CanvasTool[]).includes(activeTool)
            ? (activeTool as StrokeTool)
            : null}
          isSelectMode={activeTool === 'select'}
          color={activeTool === 'marker' ? drawColor + '99' : drawColor}
          width={activeTool === 'marker' ? drawWidth * 4 : drawWidth}
        />
      </ReactFlow>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm">
              <span className="text-2xl">🗺️</span>
            </div>
            <p className="text-base font-semibold text-stone-500">This map is empty</p>
            <p className="mt-1.5 text-sm text-stone-400">
              Use the toolbar on the left to add books,
            </p>
            <p className="text-sm text-stone-400">topics, notes, quotes, or shapes.</p>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-300">
              <span className="rounded-md border border-stone-200 bg-white px-2 py-0.5 font-medium text-stone-400">📖</span>
              <span className="rounded-md border border-stone-200 bg-white px-2 py-0.5 font-medium text-stone-400">🏷️</span>
              <span className="rounded-md border border-stone-200 bg-white px-2 py-0.5 font-medium text-stone-400">📝</span>
              <span className="rounded-md border border-stone-200 bg-white px-2 py-0.5 font-medium text-stone-400">💬</span>
              <span className="rounded-md border border-stone-200 bg-white px-2 py-0.5 font-medium text-stone-400">⬜</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating + menu */}
      <PlusMenu
        mapId={mapId}
        existingBookIds={existingBookIds}
        existingNodeCount={nodes.length}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
      />

      {/* Right-click context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
          <div
            className="fixed z-50 min-w-[160px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={handleContextDuplicate}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              <span className="text-base">⧉</span> Duplicar
            </button>
            <div className="mx-3 border-t border-stone-100" />
            <button
              onClick={handleContextDelete}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <span className="text-base">🗑</span> Eliminar
            </button>
          </div>
        </>
      )}

      {/* Edge label edit input */}
      {editingLabelEdgeId && (
        <>
          <div className="fixed inset-0 z-40" onClick={saveLabelEdit} />
          <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-2xl">
              <p className="mb-2 text-xs font-medium text-stone-400">Etiqueta de flecha</p>
              <input
                autoFocus
                value={editingLabelText}
                onChange={(e) => setEditingLabelText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveLabelEdit();
                  if (e.key === 'Escape') setEditingLabelEdgeId(null);
                }}
                placeholder="ej. influye en, contradice…"
                className="w-64 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => setEditingLabelEdgeId(null)} className="rounded-lg px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-100">Cancelar</button>
                <button onClick={saveLabelEdit} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">Guardar</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Style toolbar for selected topic/note/quote/shape node */}
      {showStyleToolbar && (
        <NodeStyleToolbar
          nodeId={selectedNode.id}
          style={(selectedNode.data as { style?: CanvasNodeData['style'] }).style}
        />
      )}

      {/* Drawing toolbar — color + stroke width */}
      {(activeTool === 'pencil' || activeTool === 'marker') && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-30 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-2 shadow-lg">
            {['#1c1917', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((c) => (
              <button
                key={c}
                onClick={() => setDrawColor(c)}
                className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: drawColor === c ? '#f59e0b' : 'transparent',
                  boxShadow: drawColor === c ? '0 0 0 2px white, 0 0 0 4px #f59e0b' : undefined,
                }}
              />
            ))}
            <div className="h-5 w-px bg-stone-200" />
            {[2, 4, 7].map((w) => (
              <button
                key={w}
                onClick={() => setDrawWidth(w)}
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                  drawWidth === w ? 'bg-amber-100' : 'hover:bg-stone-100',
                ].join(' ')}
              >
                <div className="rounded-full bg-stone-700" style={{ width: w + 4, height: w + 4 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Direction toolbar for selected edge */}
      {selectedEdgeId && (
        <div className="pointer-events-auto absolute bottom-20 left-1/2 z-30 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-2 py-1.5 shadow-lg">
            <span className="mr-1.5 text-xs font-medium text-stone-400">Flecha</span>
            {([
              { dir: 'forward',  label: '→',  title: 'Adelante' },
              { dir: 'backward', label: '←',  title: 'Atrás' },
              { dir: 'both',     label: '↔',  title: 'Bidireccional' },
              { dir: 'none',     label: '—',  title: 'Sin punta' },
            ] as { dir: EdgeDirection; label: string; title: string }[]).map(({ dir, label, title }) => {
              const active = edges.find((e) => e.id === selectedEdgeId);
              const isActive =
                active?.markerEnd && dir === 'forward' ? !active?.markerStart :
                active?.markerStart && dir === 'backward' ? !active?.markerEnd :
                dir === 'both' ? (active?.markerEnd && active?.markerStart) :
                dir === 'none' ? (!active?.markerEnd && !active?.markerStart) : false;
              return (
                <button
                  key={dir}
                  title={title}
                  onClick={() => handleEdgeDirectionChange(dir)}
                  className={[
                    'rounded-lg px-3 py-1 text-sm font-bold transition-colors',
                    isActive
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-stone-600 hover:bg-stone-100',
                  ].join(' ')}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </CanvasToolContext.Provider>
  );
}
