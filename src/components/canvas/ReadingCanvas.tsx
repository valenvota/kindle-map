import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type OnSelectionChangeFunc,
  BackgroundVariant,
} from '@xyflow/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { updateCanvasNodePosition } from '../../db/canvasRepository';
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
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<Record<string, any>>>([]);
  // Edges are loaded read-only from Dexie. Arrow creation UI is paused — see README roadmap note.
  const [edges] = useEdgesState<Edge>([]);
  const initialized = useRef(false);
  const prevMapIdRef = useRef(mapId);

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
      setNodes([]);
      prevMapIdRef.current = mapId;
    }
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

  return (
    <CanvasToolContext.Provider value={{ activeTool, setActiveTool }}>
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
        edges={edges}
        onNodesChange={onNodesChange}
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
        selectionOnDrag={!panMode}
        panOnScroll
        panOnDrag={panMode ? [0, 1, 2] : [1, 2]}
        zoomOnScroll={false}
        zoomOnPinch
        nodesConnectable={false}
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
    </div>
    </CanvasToolContext.Provider>
  );
}
