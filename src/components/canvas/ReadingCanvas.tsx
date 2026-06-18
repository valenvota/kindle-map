import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  type Node,
  type Edge,
  type Connection,
  type OnNodeDrag,
  type NodeMouseHandler,
  type OnSelectionChangeFunc,
  BackgroundVariant,
} from '@xyflow/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  updateCanvasNodePosition,
  addCanvasEdge,
  deleteCanvasEdge,
} from '../../db/canvasRepository';
import { BookNode, type BookNodeData } from './BookNode';
import { TopicNode, type TopicNodeData } from './nodes/TopicNode';
import { NoteNode, type NoteNodeData } from './nodes/NoteNode';
import { QuoteNode, type QuoteNodeData } from './nodes/QuoteNode';
import { ShapeNode, type ShapeNodeData } from './nodes/ShapeNode';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasLeftToolbar } from './CanvasLeftToolbar';
import { PlusMenu } from './PlusMenu';
import { NodeStyleToolbar } from './NodeStyleToolbar';
import { CanvasToolContext, type CanvasTool } from './CanvasToolContext';
import type { Book } from '../../types/book';
import type { CanvasNodeData } from '../../types/canvas';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [arrowSourceId, setArrowSourceId] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<Record<string, any>>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const initialized = useRef(false);
  const edgesInitialized = useRef(false);
  const prevMapIdRef = useRef(mapId);

  // Live queries
  const mapNodes = useLiveQuery(
    () => db.canvasNodes.where('mapId').equals(mapId).toArray(),
    [mapId],
  );
  const mapEdges = useLiveQuery(
    () => db.canvasEdges.where('mapId').equals(mapId).toArray(),
    [mapId],
  );
  const allBooks = useLiveQuery(() => db.books.toArray(), []);
  const map = useLiveQuery(() => db.maps.get(mapId), [mapId]);

  // Reset state when switching between maps
  useEffect(() => {
    if (prevMapIdRef.current !== mapId) {
      initialized.current = false;
      edgesInitialized.current = false;
      setNodes([]);
      setEdges([]);
      prevMapIdRef.current = mapId;
    }
  }, [mapId]);

  // ── Initialize edges from Dexie once ────────────────────────────────────
  useEffect(() => {
    if (!mapEdges || edgesInitialized.current) return;
    setEdges(
      mapEdges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    );
    edgesInitialized.current = true;
  }, [mapEdges]);

  // ── Create an arrow between two node IDs ─────────────────────────────────
  const createEdge = useCallback(async (sourceId: string, targetId: string) => {
    const id = `${mapId}:edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    console.log('[arrow] createEdge called', { sourceId, targetId, id });
    const newEdge: Edge = { id, source: sourceId, target: targetId };
    setEdges((eds) => {
      console.log('[arrow] addEdge to React Flow state, total edges after:', eds.length + 1);
      return addEdge(newEdge, eds);
    });
    console.log('[arrow] persisting edge to Dexie…');
    await addCanvasEdge({ id, mapId, source: sourceId, target: targetId, createdAt: new Date().toISOString() });
    console.log('[arrow] edge persisted to Dexie ✓');
  }, [mapId, setEdges]);

  // ── Handle-drag connections (bonus — may work after connectable fix) ──────
  const onConnect = useCallback(async (connection: Connection) => {
    console.log('[arrow] onConnect fired (handle-drag)', connection);
    if (connection.source && connection.target) {
      await createEdge(connection.source, connection.target);
    }
  }, [createEdge]);

  // ── Click-based arrow creation ────────────────────────────────────────────
  const activeToolRef = useRef(activeTool);
  const arrowSourceRef = useRef(arrowSourceId);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { arrowSourceRef.current = arrowSourceId; }, [arrowSourceId]);

  // Clear arrow source when leaving arrow mode
  useEffect(() => {
    if (activeTool !== 'arrow') {
      setArrowSourceId(null);
    } else {
      console.log('[arrow] Arrow mode activated');
    }
  }, [activeTool]);

  // Esc cancels arrow source selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && arrowSourceRef.current) {
        console.log('[arrow] Esc — cancelled arrow source');
        setArrowSourceId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Delete selected edges (persist removal) ──────────────────────────────
  const onEdgesDelete = useCallback(async (deleted: Edge[]) => {
    await Promise.all(deleted.map((e) => deleteCanvasEdge(e.id)));
  }, []);

  // ── Backspace/Delete removes selected edges only ─────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
      const selected = edges.filter((edge) => edge.selected);
      if (selected.length === 0) return;
      setEdges((eds) => eds.filter((edge) => !edge.selected));
      onEdgesDelete(selected);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [edges, setEdges, onEdgesDelete]);

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

  // ── Append newly added nodes without resetting existing layout ───────────
  useEffect(() => {
    if (!initialized.current || !mapNodes || !allBooks) return;

    setNodes((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newMapNodes = mapNodes.filter((mn) => !existingIds.has(mn.id));
      if (newMapNodes.length === 0) return prev;

      const bookMap = new Map(allBooks.map((b) => [b.id, b]));
      const newNodes = newMapNodes
        .map((mn, i) => {
          const withPosition = {
            ...mn,
            position: mn.position ?? buildInitialPosition(prev.length + i),
          };
          return buildReactFlowNode(withPosition, bookMap);
        })
        .filter((n): n is Node => n !== null);

      return [...prev, ...newNodes];
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

  // ── Track single selected node for the style toolbar ─────────────────────
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const onSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: selected }) => {
    setSelectedNodeId(selected.length === 1 ? selected[0].id : null);
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const showStyleToolbar = selectedNode && STYLEABLE_TYPES.has(selectedNode.type ?? '');

  // ── Persist position on drag stop — all selected nodes move together ────
  const onNodeDragStop: OnNodeDrag = useCallback(async (_, node) => {
    const moved = nodes.filter((n) => n.selected || n.id === node.id);
    await Promise.all(moved.map((n) => updateCanvasNodePosition(n.id, n.position)));
  }, [nodes]);

  // ── Arrow node click — called directly from node components ─────────────
  // (does NOT rely on ReactFlow onNodeClick which can be eaten by drag system)
  const [debugMsg, setDebugMsg] = useState('Arrow mode: select a source node');

  const onArrowNodeClick = useCallback((nodeId: string) => {
    console.log('[arrow] onArrowNodeClick fired, nodeId:', nodeId, 'source:', arrowSourceRef.current);
    const src = arrowSourceRef.current;
    if (!src) {
      console.log('[arrow] → source set to', nodeId);
      setDebugMsg(`Source: ${nodeId} — now click target`);
      setArrowSourceId(nodeId);
    } else if (src === nodeId) {
      console.log('[arrow] → same node — cancelled');
      setDebugMsg('Cancelled — click a different node as target');
      setArrowSourceId(null);
    } else {
      console.log('[arrow] → creating edge', src, '→', nodeId);
      setDebugMsg(`Creating edge: ${src} → ${nodeId}`);
      setArrowSourceId(null);
      createEdge(src, nodeId).then(() => {
        setDebugMsg(`Edge created ✓ — click another source`);
      });
    }
  }, [createEdge]);

  // ── ReactFlow onNodeClick (backup — may or may not fire) ─────────────────
  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    console.log('[arrow] ReactFlow onNodeClick fired for', node.id, 'tool:', activeToolRef.current);
    if (activeToolRef.current === 'arrow') onArrowNodeClick(node.id);
  }, [onArrowNodeClick]);

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

  const arrowMode = activeTool === 'arrow';
  const panMode = activeTool === 'pan';

  // ── Test button: create edge between first two nodes ─────────────────────
  const handleTestArrow = useCallback(async () => {
    if (nodes.length < 2) { alert('Need at least 2 nodes on the canvas'); return; }
    const [a, b] = nodes;
    console.log('[arrow] TEST ARROW between', a.id, 'and', b.id);
    setDebugMsg(`TEST: creating edge ${a.id} → ${b.id}`);
    await createEdge(a.id, b.id);
    setDebugMsg(`TEST edge created ✓`);
  }, [nodes, createEdge]);

  return (
    <CanvasToolContext.Provider value={{ activeTool, setActiveTool, arrowSourceId, onArrowNodeClick }}>
    <div className="relative h-screen w-full bg-stone-50">
      <CanvasToolbar
        mapName={map?.name ?? '…'}
        onBack={onBack}
        onLibrary={onLibrary}
        onAutoArrange={handleAutoArrange}
      />

      <CanvasLeftToolbar />

      <ReactFlow
        nodes={nodes}
        edges={[
          ...edges,
          // Hardcoded test edge — always injected when 2+ nodes exist
          // Remove once edge rendering is confirmed working
          ...(nodes.length >= 2 ? [{
            id: '__hardcoded_test__',
            source: nodes[0].id,
            target: nodes[1].id,
            style: { stroke: '#ff0000', strokeWidth: 4 },
            animated: true,
          }] : []),
        ]}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodeClick={onNodeClick}
        onPaneClick={arrowMode ? () => { console.log('[arrow] pane clicked — cancelled source'); setArrowSourceId(null); } : undefined}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        selectionOnDrag={!arrowMode && !panMode}
        panOnScroll
        panOnDrag={panMode ? [0, 1, 2] : [1, 2]}
        zoomOnScroll={false}
        zoomOnPinch
        connectionMode={ConnectionMode.Loose}
        connectOnClick={arrowMode}
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
      </ReactFlow>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-stone-400">This map is empty</p>
            <p className="mt-1 text-sm text-stone-400">
              Use the toolbar on the left to add books, topics, notes, or shapes
            </p>
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

      {/* Style toolbar for selected topic/note/quote/shape node */}
      {showStyleToolbar && (
        <NodeStyleToolbar
          nodeId={selectedNode.id}
          style={(selectedNode.data as { style?: CanvasNodeData['style'] }).style}
        />
      )}

      {/* ── DEBUG OVERLAY (arrow mode) ───────────────────────── */}
      {arrowMode && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-50 -translate-x-1/2 w-[480px]">
          <div className="rounded-xl bg-black/90 px-4 py-3 text-xs font-mono text-white shadow-xl">
            <div className="mb-1 font-bold text-amber-400">🔗 ARROW DEBUG</div>
            <div className="text-green-300">{debugMsg}</div>
            <div className="mt-1 text-stone-300">
              tool={activeTool} | src={arrowSourceId ?? 'none'}
            </div>
            <div className="mt-1 text-stone-300">
              nodes={nodes.length} | rfEdges={edges.length} | dbEdges={mapEdges?.length ?? '?'}
            </div>
            <div className="mt-1 text-yellow-300">
              hardcoded red edge: {nodes.length >= 2 ? `${nodes[0].id.slice(-8)} → ${nodes[1].id.slice(-8)}` : 'need 2 nodes'}
            </div>
            {/* First 3 RF edges */}
            <div className="mt-2 text-stone-400 text-[10px]">── RF edges (first 3) ──</div>
            {edges.slice(0, 3).map((e) => {
              const srcExists = nodes.some((n) => n.id === e.source);
              const tgtExists = nodes.some((n) => n.id === e.target);
              return (
                <div key={e.id} className={`text-[10px] ${srcExists && tgtExists ? 'text-green-400' : 'text-red-400'}`}>
                  {e.id.slice(-12)}: {e.source.slice(-8)} → {e.target.slice(-8)} | src✓={String(srcExists)} tgt✓={String(tgtExists)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TEST ARROW BUTTON ────────────────────────────────── */}
      {arrowMode && nodes.length >= 2 && (
        <div className="absolute bottom-6 right-6 z-50 pointer-events-auto">
          <button
            onClick={handleTestArrow}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xl hover:bg-red-700"
          >
            🧪 Test Arrow (node 0→1)
          </button>
        </div>
      )}
    </div>
    </CanvasToolContext.Provider>
  );
}
