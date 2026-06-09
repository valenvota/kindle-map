import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  type Node,
  type OnNodeDrag,
  type NodeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { updateCanvasNodePosition } from '../../db/canvasRepository';
import { BookNode, type BookNodeData } from './BookNode';
import { TopicNode, type TopicNodeData } from './nodes/TopicNode';
import { NoteNode, type NoteNodeData } from './nodes/NoteNode';
import { QuoteNode, type QuoteNodeData } from './nodes/QuoteNode';
import { CanvasToolbar } from './CanvasToolbar';
import { PlusMenu } from './PlusMenu';
import { BookDetailView } from '../book/BookDetailView';
import type { Book } from '../../types/book';
import type { CanvasNodeData } from '../../types/canvas';

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
  const base = { id: mn.id, position: mn.position, connectable: false as const };

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
        data: { nodeId: mn.id, content: mn.content ?? '' } satisfies TopicNodeData,
      };
    case 'note':
      return {
        ...base,
        type: 'note',
        data: { nodeId: mn.id, content: mn.content ?? '' } satisfies NoteNodeData,
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
        } satisfies QuoteNodeData,
      };
    }
    default:
      return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  mapId: string;
  onBack: () => void;    // → Maps list
  onLibrary: () => void; // → Library
};

export function ReadingCanvas({ mapId, onBack, onLibrary }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<Record<string, any>>>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
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

  // ── Persist position on drag stop (position-only update) ────────────────
  const onNodeDragStop: OnNodeDrag = useCallback(async (_, node) => {
    await updateCanvasNodePosition(node.id, node.position);
  }, []);

  // ── Double-click book node → open detail drawer ──────────────────────────
  const onNodeDoubleClick: NodeMouseHandler = useCallback((_, node) => {
    if (node.type !== 'book') return;
    const book = (node.data as BookNodeData).book;
    setSelectedBook(book);
  }, []);

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

  return (
    <div className="relative h-screen w-full bg-stone-50">
      <CanvasToolbar
        mapName={map?.name ?? '…'}
        onBack={onBack}
        onLibrary={onLibrary}
        onAutoArrange={handleAutoArrange}
      />

      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={null}
        selectionKeyCode={null}
        panOnScroll
        panOnDrag
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
      </ReactFlow>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-stone-400">This map is empty</p>
            <p className="mt-1 text-sm text-stone-400">
              Tap <span className="font-semibold">+</span> to add books, topics, notes, or quotes
            </p>
          </div>
        </div>
      )}

      {/* Floating + menu */}
      <PlusMenu
        mapId={mapId}
        existingBookIds={existingBookIds}
        existingNodeCount={nodes.length}
      />

      {/* Book detail drawer */}
      {selectedBook && (
        <BookDetailView book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}
