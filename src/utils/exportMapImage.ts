import { toPng } from 'html-to-image';
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { Node } from '@xyflow/react';

const IMAGE_WIDTH = 2400;
const IMAGE_HEIGHT = 1600;
const PADDING = 80;

export async function exportMapAsPng(
  nodes: Node[],
  mapName: string,
): Promise<void> {
  const flowEl = document.querySelector<HTMLElement>('.react-flow__viewport');
  if (!flowEl) throw new Error('React Flow viewport not found');

  // Calculate a transform that fits all nodes into the export canvas
  const bounds = getNodesBounds(nodes);
  const viewport = getViewportForBounds(bounds, IMAGE_WIDTH, IMAGE_HEIGHT, 0.05, 4, PADDING);

  const dataUrl = await toPng(flowEl, {
    backgroundColor: '#fafaf9',
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    pixelRatio: 1.5,
    style: {
      width: `${IMAGE_WIDTH}px`,
      height: `${IMAGE_HEIGHT}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      transformOrigin: 'top left',
    },
  });

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${mapName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-map.png`;
  a.click();
}
