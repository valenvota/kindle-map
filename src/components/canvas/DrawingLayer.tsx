import { useRef, useState, useEffect, useCallback } from 'react';
import { useViewport } from '@xyflow/react';
import type { CanvasStroke, StrokePoint, StrokeTool } from '../../types/canvas';
import { addStroke, deleteStroke, getStrokesByMap } from '../../db/canvasStrokesRepository';

type Props = {
  mapId: string;
  tool: StrokeTool | null;   // null = drawing mode off
  isSelectMode: boolean;     // true when activeTool === 'select'
  color: string;
  width: number;
};

const SAMPLE_RATE = 2;

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

function pointsToPath(pts: StrokePoint[]): string {
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
  const pointCount = useRef(0);
  const active = tool !== null;

  // Load / reload strokes when map changes
  useEffect(() => {
    setStrokes([]);
    setSelectedIds(new Set());
    setCurrent(null);
    getStrokesByMap(mapId).then(setStrokes);
  }, [mapId]);

  // Deselect when leaving select mode
  useEffect(() => {
    if (!isSelectMode) setSelectedIds(new Set());
  }, [isSelectMode]);

  // Backspace / Delete → remove selected strokes
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      if (selectedIds.size === 0) return;
      const ids = [...selectedIds];
      setSelectedIds(new Set());
      setStrokes((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      await Promise.all(ids.map(deleteStroke));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds]);

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
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!active) return;
    if (e.pointerType === 'touch' && tool !== 'eraser') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = svgRef.current!.getBoundingClientRect();
    const pt = { ...toCanvas(e.clientX, e.clientY, rect, viewport), pressure: e.pressure || 0.5 };
    pointCount.current = 0;
    setCurrent([pt]);
  }, [active, tool, viewport]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!active || !current) return;
    if (e.pointerType === 'touch' && tool !== 'eraser') return;
    e.preventDefault();
    pointCount.current++;
    if (pointCount.current % SAMPLE_RATE !== 0) return;

    const rect = svgRef.current!.getBoundingClientRect();
    const pt = { ...toCanvas(e.clientX, e.clientY, rect, viewport), pressure: e.pressure || 0.5 };

    if (tool === 'eraser') {
      const RADIUS = 20 / viewport.zoom;
      setStrokes((prev) => {
        const toErase = prev.filter((s) =>
          s.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < RADIUS),
        );
        toErase.forEach((s) => deleteStroke(s.id));
        return prev.filter((s) => !toErase.some((d) => d.id === s.id));
      });
      return;
    }

    setCurrent((prev) => prev ? [...prev, pt] : [pt]);
  }, [active, current, tool, viewport]);

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
    setStrokes((prev) => [...prev, stroke]);
    setCurrent(null);
    await addStroke(stroke);
  }, [active, current, tool, mapId, color, width]);

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
          return (
            <g key={s.id} onClick={(e) => handleStrokeClick(e, s.id)} style={{ cursor: isSelectMode ? 'pointer' : 'default' }}>
              {/* Wide invisible hit area for easier clicking */}
              <path
                d={pointsToPath(s.points)}
                style={{ stroke: 'transparent', strokeWidth: Math.max(s.width, 12), fill: 'none', pointerEvents: isSelectMode ? 'stroke' : 'none' }}
              />
              {/* Selection highlight */}
              {selected && (
                <path
                  d={pointsToPath(s.points)}
                  style={{ stroke: '#3D6B8E', strokeWidth: s.width + 4, fill: 'none', opacity: 0.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}
                />
              )}
              {/* Actual stroke */}
              <path
                d={pointsToPath(s.points)}
                style={{
                  stroke: s.color,
                  strokeWidth: s.width,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  fill: 'none',
                  opacity: s.tool === 'marker' ? 0.35 : 1,
                  pointerEvents: 'none',
                }}
              />
            </g>
          );
        })}
        {current && current.length >= 2 && (
          <path
            d={pointsToPath(current)}
            style={{
              stroke: color,
              strokeWidth: width,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              fill: 'none',
              opacity: tool === 'marker' ? 0.35 : 1,
              pointerEvents: 'none',
            }}
          />
        )}
      </g>
    </svg>
  );
}
