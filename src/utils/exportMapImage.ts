import { toPng } from 'html-to-image';
import { getViewportForBounds, type ReactFlowInstance } from '@xyflow/react';

export type ExportBounds = { x: number; y: number; width: number; height: number };

// Aim for ~this wide, but never let either dimension exceed MAX_DIM (keeps PNGs
// from ballooning on large maps / hi-dpi screens).
const TARGET_WIDTH = 2400;
const MAX_DIM = 4096;
// getViewportForBounds' `padding` is a RATIO of the container, not pixels. The
// old export passed 80 here, which read as 8000% padding → the content collapsed
// to min-zoom and rendered tiny/blurry. 0.12 leaves a calm ~12% margin.
const PADDING = 0.12;

/**
 * WYSIWYG PNG export (Export Lite). Instead of cloning just the nodes layer, we
 * briefly fit the *live* React Flow viewport to the target bounds and capture the
 * whole `.react-flow` element — so the wallpaper, ink strokes, nodes and edges
 * all come through exactly as drawn. Controls / panels / attribution are filtered
 * out (the app toolbars live outside `.react-flow`, so they're excluded already).
 * The viewport is always restored in `finally`.
 */
export async function exportMapAsPng(opts: {
  instance: ReactFlowInstance;
  bounds: ExportBounds;
  mapName: string;
}): Promise<void> {
  const { instance, bounds, mapName } = opts;
  const flowEl = document.querySelector<HTMLElement>('.react-flow');
  if (!flowEl) throw new Error('React Flow container not found');

  const rect = flowEl.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) throw new Error('Canvas has no on-screen size to export');

  const saved = instance.getViewport();
  try {
    // Fit the bounds into the on-screen container, then capture as-is.
    const vp = getViewportForBounds(bounds, rect.width, rect.height, 0.05, 4, PADDING);
    instance.setViewport(vp);
    // Let React Flow (and the ink/background layers, which follow the viewport)
    // re-render at the new transform before we snapshot.
    await new Promise((r) => setTimeout(r, 90));

    // Resolution: scale up toward TARGET_WIDTH, capped so neither side > MAX_DIM.
    const pixelRatio = Math.max(
      1,
      Math.min(TARGET_WIDTH / rect.width, MAX_DIM / rect.width, MAX_DIM / rect.height),
    );

    // Desk colour behind any transparent gaps (matches the live canvas).
    const backgroundColor = getComputedStyle(flowEl).backgroundColor || '#EDEAE4';

    // Guard against a pathological html-to-image hang so a failed export can
    // never leave the canvas stuck at the fitted zoom (finally still restores).
    const dataUrl = await Promise.race<string>([
      toPng(flowEl, {
        backgroundColor,
        pixelRatio,
        filter: (node) => {
          const cl = (node as HTMLElement).classList;
          if (!cl) return true;
          // Drop the floating chrome that lives inside `.react-flow`.
          return !(
            cl.contains('react-flow__panel') ||       // Controls + attribution are panels
            cl.contains('react-flow__controls') ||
            cl.contains('react-flow__attribution') ||
            cl.contains('react-flow__minimap')
          );
        },
      }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Export timed out')), 30000),
      ),
    ]);

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${mapName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-map.png`;
    a.click();
  } finally {
    instance.setViewport(saved);
  }
}
