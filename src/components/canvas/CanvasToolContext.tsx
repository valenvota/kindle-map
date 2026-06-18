import { createContext, useContext } from 'react';

export type CanvasTool =
  | 'select'
  | 'pan'
  | 'book'
  | 'topic'
  | 'note'
  | 'quote'
  | 'rectangle'
  | 'circle'
  | 'arrow';

type CanvasToolContextValue = {
  activeTool: CanvasTool;
  setActiveTool: (tool: CanvasTool) => void;
  /** ID of the node waiting to be the source of the next arrow, or null */
  arrowSourceId: string | null;
  /** Called by each node component on click when arrow mode is active */
  onArrowNodeClick: (nodeId: string) => void;
};

export const CanvasToolContext = createContext<CanvasToolContextValue>({
  activeTool: 'select',
  setActiveTool: () => {},
  arrowSourceId: null,
  onArrowNodeClick: () => {},
});

export function useCanvasTool() {
  return useContext(CanvasToolContext);
}
