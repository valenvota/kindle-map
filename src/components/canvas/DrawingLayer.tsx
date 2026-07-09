import { useRef, useState, useEffect, useCallback } from 'react';
import { useViewport } from '@xyflow/react';
import type { CanvasStroke, StrokePoint, StrokeTool } from '../../types/canvas';
import { addStroke, deleteStroke, getStrokesByMap } from '../../db/canvasStrokesRepository';

type Props = {
  mapId: string;
  tool: StrokeTool | null;   // null = drawing mode off
  color: string;
  width: number;
};

// Simplify points: keep only every Nth point during draw to reduce array size
const SAMPLE_RATE = 2;

// Convert screen coords → canvas coords accounting for React Flow viewport
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

function strokeStyle(s: CanvasStroke) {
  return {
    stroke: s.color,
    strokeWidth: s.width,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
    opacity: s.tool === 'marker' ? 0.35 : 1,
    pointerEvents: 'stroke' as const,
  };
}

export function DrawingLayer({ mapId, tool, color, width }: Props) {
  const viewport = useViewport();
  const svgRef = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<CanvasStroke[]>([]);
  const [current, setCurrent] = useState<StrokePoint[] | null>(null);
  const pointCount = useRef(0);
  const active = tool !== null;

  // Load existing strokes for this map
  useEffect(() => {
    getStrokesByMap(mapId).then(setStrokes);
  }, [mapId]);

  // Reset when map changes
  useEffect(() => {
    setStrokes([]);
    setCurrent(null);
    getStrokesByMap(mapId).then(setStrokes);
  }, [mapId]);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!active) return;
    // Touch = finger → let React Flow handle pan/zoom; pen/mouse → draw
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
      // Erase any stroke close to pointer
      const RADIUS = 20 / viewport.zoom;
      setStrokes((prev) => {
        const toDelete = prev.filter((s) =>
          s.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < RADIUS),
        );
        toDelete.forEach((s) => deleteStroke(s.id));
        return prev.filter((s) => !toDelete.some((d) => d.id === s.id));
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
        pointerEvents: active ? 'all' : 'none',
        touchAction: active ? 'none' : 'auto',
        zIndex: 10,
        overflow: 'visible',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <g transform={`translate(${viewport.x},${viewport.y}) scale(${viewport.zoom})`}>
        {strokes.map((s) => (
          <path key={s.id} d={pointsToPath(s.points)} style={strokeStyle(s)} />
        ))}
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
            }}
          />
        )}
      </g>
    </svg>
  );
}
