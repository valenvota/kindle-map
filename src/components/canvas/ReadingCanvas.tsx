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
import { Plus } from 'lucide-react';
import { db } from '../../db/db';
import { upsertCanvasNode } from '../../db/canvasRepository';
import { BookNode, type BookNodeData } from './BookNode';
import { CanvasToolbar } from './CanvasToolbar';
import { AddBookModal } from './AddBookModal';
import { BookDetailView } from '../book/BookDetailView';
import type { Book } from '../../types/book';

const NODE_WIDTH = 208;
const NODE_HEIGHT = 180;
const GRID_COL_GAP = 40;
const GRID_ROW_GAP = 40;
const COLS = 4;

const nodeTypes = { book: BookNode };

function buildInitialPosition(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    x: 60 + col * (NODE_WIDTH + GRID_COL_GAP),
    y: 60 + row * (NODE_HEIGHT + GRID_ROW_GAP),
  };
}

function bookToNode(
  nodeId: string,
  book: Book,
  position: { x: number; y: number },
): Node<BookNodeData> {
  return {
    id: nodeId,
    type: 'book',
    position,
    data: { book },
    connectable: false,
  };
}

type Props = {
  mapId: string;
  onBack: () => void;    // → Maps list
  onLibrary: () => void; // → Library
};

export function ReadingCanvas({ mapId, onBack, onLibrary }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BookNodeData>>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const initialized = useRef(false);
  const prevMapIdRef = useRef(mapId);

  // Live data
  const mapNodes = useLiveQuery(
    () => db.canvasNodes.where('mapId').equals(mapId).toArray(),
    [mapId],
  );
  const allBooks = useLiveQuery(() => db.books.toArray(), []);
  const map = useLiveQuery(() => db.maps.get(mapId), [mapId]);

  // Reset when navigating to a different map
  useEffect(() => {
    if (prevMapIdRef.current !== mapId) {
      initialized.current = false;
      setNodes([]);
      prevMapIdRef.current = mapId;
    }
  }, [mapId]);

  // ── Initialize nodes from Dexie once ──────────────────────────────────────
  useEffect(() => {
    if (!mapNodes || !allBooks || initialized.current) return;

    const bookMap = new Map(allBooks.map((b) => [b.id, b]));
    const initialNodes = mapNodes
      .map((mn) => {
        const book = bookMap.get(mn.bookId);
        if (!book) return null;
        return bookToNode(mn.id, book, mn.position);
      })
      .filter((n): n is Node<BookNodeData> => n !== null);

    setNodes(initialNodes);
    initialized.current = true;
  }, [mapNodes, allBooks]);

  // ── Append newly added nodes without resetting existing ones ──────────────
  useEffect(() => {
    if (!initialized.current || !mapNodes || !allBooks) return;

    setNodes((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newMapNodes = mapNodes.filter((mn) => !existingIds.has(mn.id));
      if (newMapNodes.length === 0) return prev;

      const bookMap = new Map(allBooks.map((b) => [b.id, b]));
      const newNodes = newMapNodes
        .map((mn, i) => {
          const book = bookMap.get(mn.bookId);
          if (!book) return null;
          return bookToNode(
            mn.id,
            book,
            mn.position ?? buildInitialPosition(prev.length + i),
          );
        })
        .filter((n): n is Node<BookNodeData> => n !== null);

      return [...prev, ...newNodes];
    });
  }, [mapNodes, allBooks]);

  // ── Persist position on drag stop ─────────────────────────────────────────
  const onNodeDragStop: OnNodeDrag<Node<BookNodeData>> = useCallback(
    async (_, node) => {
      const bookId = (node.data as BookNodeData).book.id;
      await upsertCanvasNode({
        id: node.id,
        bookId,
        mapId,
        type: 'book',
        position: node.position,
      });
    },
    [mapId],
  );

  // ── Double click → open book detail ───────────────────────────────────────
  const onNodeDoubleClick: NodeMouseHandler<Node<BookNodeData>> = useCallback((_, node) => {
    setSelectedBook((node.data as BookNodeData).book);
  }, []);

  // ── Auto arrange ──────────────────────────────────────────────────────────
  const handleAutoArrange = useCallback(async () => {
    const arranged = nodes.map((node, i) => ({
      ...node,
      position: buildInitialPosition(i),
    }));
    setNodes(arranged);
    await Promise.all(
      arranged.map((node) =>
        upsertCanvasNode({
          id: node.id,
          bookId: (node.data as BookNodeData).book.id,
          mapId,
          type: 'book',
          position: node.position,
        }),
      ),
    );
  }, [nodes, setNodes, mapId]);

  // ── Derived state for AddBookModal ────────────────────────────────────────
  const existingBookIds = useMemo(
    () => new Set(nodes.map((n) => (n.data as BookNodeData).book.id)),
    [nodes],
  );

  const isEmpty = nodes.length === 0;

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

      {/* Empty state overlay */}
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-stone-400">This map is empty</p>
            <p className="mt-1 text-sm text-stone-400">
              Tap <span className="font-semibold">+</span> to add books from your Library
            </p>
          </div>
        </div>
      )}

      {/* Floating + button */}
      <button
        onClick={() => setShowAddBook(true)}
        title="Add book to map"
        className="absolute bottom-6 left-1/2 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition-transform hover:scale-105 hover:bg-amber-600 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add Book modal */}
      {showAddBook && (
        <AddBookModal
          mapId={mapId}
          existingBookIds={existingBookIds}
          existingNodeCount={nodes.length}
          onClose={() => setShowAddBook(false)}
        />
      )}

      {/* Book detail drawer */}
      {selectedBook && (
        <BookDetailView book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}
