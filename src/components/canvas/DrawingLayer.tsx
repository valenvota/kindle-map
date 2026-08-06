import { useRef, useState, useEffect, useCallback } from 'react';
import { useViewport } from '@xyflow/react';
import { getStroke } from 'perfect-freehand';
import type { CanvasStroke, StrokePoint, StrokeTool } from '../../types/canvas';
import { addStroke, deleteStroke, getStrokesByMap } from '../../db/canvasStrokesRepository';

type Props = {
  mapId: string;
  tool: StrokeTool | null;   // null = drawing mode off
  isSelectMode: boolean;     // true when activeTool === 'select'
  color: string;
  width: number;
};

// perfect-freehand options. `simulatePressure` derives width from stroke
// velocity, so even a mouse/trackpad (which reports a flat 0.5 pressure) gets a
// tapered, inky line. `streamline` smooths the raw input, which is why we no
// longer decimate points on the way in.
function strokeOptions(size: number, last: boolean) {
  return {
    size,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: true,
    last,
  };
}

// Turn perfect-freehand's outline points into a filled SVG path.
function outlineToPath(outline: number[][]): string {
  if (outline.length === 0) return '';
  const d = outline.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...outline[0], 'Q'] as (string | number)[],
  );
  d.push('Z');
  return d.join(' ');
}

function strokeToFillPath(points: StrokePoint[], size: number, last: boolean): string {
  return outlineToPath(getStroke(points, strokeOptions(size, last)));
}

function toCanvas(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  vp: { x: number; y: number; zoom: number },
) {
  return {
    x: (clientX - rect.left - vp.x) / vp.zoom,
    y: (clientY - rect.top  - vp.y) / vp.zoom,
  };
}

// Centerline path — used only as the wide invisible hit area for click-select,
// independent of how the stroke is painted.
function centerlinePath(pts: StrokePoint[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const mid = { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 };
    d += ` Q ${pts[i - 1].x} ${pts[i - 1].y} ${mid.x} ${mid.y}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  return d;
}

export function DrawingLayer({ mapId, tool, isSelectMode, color, width }: Props) {
  const viewport = useViewport();
  const svgRef = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<CanvasStroke[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState<StrokePoint[] | null>(null);
  const active = tool !== null;

  // ── Scoped undo/redo for strokes (Sprint 4B) ──────────────────────────────
  // Snapshot stacks of the whole stroke set. Ctrl+Z/Y is handled here ONLY while
  // a drawing tool is engaged (see the gated effect below); in select mode the
  // node-level history in ReadingCanvas keeps handling Ctrl+Z/Y instead.
  const strokesRef = useRef<CanvasStroke[]>([]);
  const undoStack = useRef<CanvasStroke[][]>([]);
  const redoStack = useRef<CanvasStroke[][]>([]);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);

  const pushUndo = useCallback((snapshot: CanvasStroke[]) => {
    undoStack.current.push(snapshot);
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  // Reconcile Dexie to a target stroke set (delete removed, add restored).
  const applyStrokeState = useCallback(async (from: CanvasStroke[], to: CanvasStroke[]) => {
    const toIds = new Set(to.map((s) => s.id));
    const fromIds = new Set(from.map((s) => s.id));
    await Promise.all(from.filter((s) => !toIds.has(s.id)).map((s) => deleteStroke(s.id)));
    await Promise.all(to.filter((s) => !fromIds.has(s.id)).map((s) => addStroke(s)));
  }, []);

  // Load / reload strokes when map changes (also clears history)
  useEffect(() => {
    setStrokes([]);
    setSelectedIds(new Set());
    setCurrent(null);
    undoStack.current = [];
    redoStack.current = [];
    getStrokesByMap(mapId).then(setStrokes);
  }, [mapId]);

  // Deselect when leaving select mode
  useEffect(() => {
    if (!isSelectMode) setSelectedIds(new Set());
  }, [isSelectMode]);

  // Backspace / Delete → remove selected strokes (undoable)
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      if (selectedIds.size === 0) return;
      const ids = [...selectedIds];
      pushUndo(strokesRef.current);
      setSelectedIds(new Set());
      setStrokes((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      await Promise.all(ids.map(deleteStroke));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, pushUndo]);

  // ── Scoped stroke undo/redo — armed only while a drawing tool is engaged ──
  useEffect(() => {
    if (!active) return;
    const handler = async (e: KeyboardEvent) => {
      const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z';
      const isRedo = (e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'));
      if (!isUndo && !isRedo) return;
      e.preventDefault();
      const cur = strokesRef.current;
      if (isUndo) {
        const target = undoStack.current.pop();
        if (!target) return;
        redoStack.current.push(cur);
        await applyStrokeState(cur, target);
        setStrokes(target);
      } else {
        const target = redoStack.current.pop();
        if (!target) return;
        undoStack.current.push(cur);
        await applyStrokeState(cur, target);
        setStrokes(target);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, applyStrokeState]);

  // ── Click to select a stroke ──────────────────────────────────────────────
  const handleStrokeClick = useCallback((e: React.MouseEvent, id: string) => {
    if (!isSelectMode) return;
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (e.shiftKey) {
        next.has(id) ? next.delete(id) : next.add(id);
      } else {
        if (next.has(id) && next.size === 1) {
          next.clear(); // click selected → deselect
        } else {
          next.clear();
          next.add(id);
        }
      }
      return next;
    });
  }, [isSelectMode]);

  // Click on empty SVG area → deselect all
  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isSelectMode) return;
    if ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).tagName === 'g') {
      setSelectedIds(new Set());
    }
  }, [isSelectMode]);

  // ── Drawing pointer handlers ──────────────────────────────────────────────
  // One undo step per eraser gesture: captured at pointer-down, pushed on the
  // first stroke actually erased during the drag.
  const eraseBase = useRef<CanvasStroke[] | null>(null);
  const erasePushed = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!active) return;
    if (e.pointerType === 'touch' && tool !== 'eraser') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = svgRef.current!.getBoundingClientRect();
    const pt = { ...toCanvas(e.clientX, e.clientY, rect, viewport), pressure: e.pressure || 0.5 };
    if (tool === 'eraser') {
      eraseBase.current = strokesRef.current;
      erasePushed.current = false;
    }
    setCurrent([pt]);
  }, [active, tool, viewport]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!active || !current) return;
    if (e.pointerType === 'touch' && tool !== 'eraser') return;
    e.preventDefault();

    const rect = svgRef.current!.getBoundingClientRect();
    const pt = { ...toCanvas(e.clientX, e.clientY, rect, viewport), pressure: e.pressure || 0.5 };

    if (tool === 'eraser') {
      const RADIUS = 20 / viewport.zoom;
      setStrokes((prev) => {
        const toErase = prev.filter((s) =>
          s.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < RADIUS),
        );
        if (toErase.length === 0) return prev;
        // First erase of this gesture → snapshot the pre-gesture set once.
        if (!erasePushed.current) {
          pushUndo(eraseBase.current ?? prev);
          erasePushed.current = true;
        }
        toErase.forEach((s) => deleteStroke(s.id));
        return prev.filter((s) => !toErase.some((d) => d.id === s.id));
      });
      return;
    }

    setCurrent((prev) => prev ? [...prev, pt] : [pt]);
  }, [active, current, tool, viewport, pushUndo]);

  const handlePointerUp = useCallback(async (e: React.PointerEvent<SVGSVGElement>) => {
    if (!active || !current || current.length < 2 || tool === 'eraser') {
      setCurrent(null);
      return;
    }
    if (e.pointerType === 'touch') { setCurrent(null); return; }

    const stroke: CanvasStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      mapId,
      tool,
      color,
      width,
      points: current,
      createdAt: new Date().toISOString(),
    };
    pushUndo(strokesRef.current);
    setStrokes((prev) => [...prev, stroke]);
    setCurrent(null);
    await addStroke(stroke);
  }, [active, current, tool, mapId, color, width, pushUndo]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        // Only the drawing tools need the full overlay to capture pointer events.
        // In select mode the container must stay transparent to pointers so that
        // ReactFlow keeps handling node clicks / box-select / right-click; the
        // individual stroke hit-paths below re-enable `pointer-events: stroke`
        // so strokes remain selectable even through the transparent container.
        pointerEvents: active ? 'all' : 'none',
        touchAction: active ? 'none' : 'auto',
        zIndex: 10,
        overflow: 'visible',
        cursor: isSelectMode ? 'default' : active ? 'crosshair' : 'default',
      }}
      onClick={handleSvgClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <g transform={`translate(${viewport.x},${viewport.y}) scale(${viewport.zoom})`}>
        {strokes.map((s) => {
          const selected = selectedIds.has(s.id);
          const fill = strokeToFillPath(s.points, s.width, true);
          return (
            <g key={s.id} onClick={(e) => handleStrokeClick(e, s.id)} style={{ cursor: isSelectMode ? 'pointer' : 'default' }}>
              {/* Wide invisible hit area for easier clicking (centerline) */}
              <path
                d={centerlinePath(s.points)}
                style={{ stroke: 'transparent', strokeWidth: Math.max(s.width, 12), fill: 'none', pointerEvents: isSelectMode ? 'stroke' : 'none' }}
              />
              {/* Selection highlight — traces the stroke silhouette */}
              {selected && (
                <path
                  d={fill}
                  style={{ stroke: '#3D6B8E', strokeWidth: 3, fill: 'none', opacity: 0.9, strokeLinejoin: 'round', pointerEvents: 'none' }}
                />
              )}
              {/* Actual stroke — filled variable-width outline */}
              <path
                d={fill}
                style={{
                  fill: s.color,
                  opacity: s.tool === 'marker' ? 0.35 : 1,
                  pointerEvents: 'none',
                }}
              />
            </g>
          );
        })}
        {current && current.length >= 2 && tool !== 'eraser' && (
          <path
            d={strokeToFillPath(current, width, false)}
            style={{
              fill: color,
              opacity: tool === 'marker' ? 0.35 : 1,
              pointerEvents: 'none',
            }}
          />
        )}
      </g>
    </svg>
  );
}
