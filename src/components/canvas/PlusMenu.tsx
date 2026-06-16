import { useState, useEffect } from 'react';
import type { CanvasTool } from './CanvasToolContext';
import { upsertCanvasNode } from '../../db/canvasRepository';
import { AddBookModal } from './AddBookModal';
import { AddQuoteModal } from './AddQuoteModal';

function newNodePosition(existingCount: number): { x: number; y: number } {
  const col = existingCount % 4;
  const row = Math.floor(existingCount / 4);
  return { x: 60 + col * 248, y: 60 + row * 220 };
}

type ActiveModal = 'book' | 'topic' | 'note' | 'quote' | null;

function addShape(mapId: string, shapeKind: 'rectangle' | 'circle', position: { x: number; y: number }) {
  return upsertCanvasNode({
    id: `${mapId}:shape-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    mapId,
    type: 'shape',
    shapeKind,
    position,
    width: 160,
    height: shapeKind === 'circle' ? 160 : 100,
  });
}

type Props = {
  mapId: string;
  existingBookIds: Set<string>;
  existingNodeCount: number;
  activeTool?: CanvasTool;
  setActiveTool?: (tool: CanvasTool) => void;
};

export function PlusMenu({ mapId, existingBookIds, existingNodeCount, activeTool, setActiveTool }: Props) {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const pos = newNodePosition(existingNodeCount);

  // Drive modal open/close from the left toolbar tool selection
  useEffect(() => {
    if (!activeTool || !setActiveTool) return;
    if (activeTool === 'book')      { setActiveModal('book');  setActiveTool('select'); }
    else if (activeTool === 'topic') { setActiveModal('topic'); setActiveTool('select'); }
    else if (activeTool === 'note')  { setActiveModal('note');  setActiveTool('select'); }
    else if (activeTool === 'quote') { setActiveModal('quote'); setActiveTool('select'); }
    else if (activeTool === 'rectangle') { addShape(mapId, 'rectangle', pos); setActiveTool('select'); }
    else if (activeTool === 'circle')    { addShape(mapId, 'circle', pos);    setActiveTool('select'); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      {activeModal === 'book' && (
        <AddBookModal
          mapId={mapId}
          existingBookIds={existingBookIds}
          existingNodeCount={existingNodeCount}
          onClose={closeModal}
        />
      )}
      {activeModal === 'topic' && (
        <AddTopicModal mapId={mapId} position={pos} onClose={closeModal} />
      )}
      {activeModal === 'note' && (
        <AddNoteModal mapId={mapId} position={pos} onClose={closeModal} />
      )}
      {activeModal === 'quote' && (
        <AddQuoteModal mapId={mapId} newNodePosition={pos} onClose={closeModal} />
      )}
    </>
  );
}

// ─── AddTopicModal ────────────────────────────────────────────────────────────

function AddTopicModal({ mapId, position, onClose }: { mapId: string; position: { x: number; y: number }; onClose: () => void }) {
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    await upsertCanvasNode({
      id: `${mapId}:topic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      mapId,
      type: 'topic',
      content: label.trim(),
      position,
    });
    onClose();
  };

  return (
    <SimpleModal title="Add Topic" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          autoFocus
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Topic label…"
          className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <ModalActions onClose={onClose} submitLabel="Add to map" disabled={!label.trim() || saving} />
      </form>
    </SimpleModal>
  );
}

// ─── AddNoteModal ─────────────────────────────────────────────────────────────

function AddNoteModal({ mapId, position, onClose }: { mapId: string; position: { x: number; y: number }; onClose: () => void }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    await upsertCanvasNode({
      id: `${mapId}:note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      mapId,
      type: 'note',
      content: text.trim(),
      position,
    });
    onClose();
  };

  return (
    <SimpleModal title="Add Note" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your note…"
          rows={4}
          className="w-full resize-none rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <ModalActions onClose={onClose} submitLabel="Add to map" disabled={!text.trim() || saving} />
      </form>
    </SimpleModal>
  );
}

// ─── Shared modal shell ───────────────────────────────────────────────────────

function SimpleModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-semibold text-stone-900">{title}</h2>
        {children}
      </div>
    </>
  );
}

function ModalActions({ onClose, submitLabel, disabled }: { onClose: () => void; submitLabel: string; disabled?: boolean }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="flex-1 rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </div>
  );
}
