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
};

export const CanvasToolContext = createContext<CanvasToolContextValue>({
  activeTool: 'select',
  setActiveTool: () => {},
  arrowSourceId: null,
});

export function useCanvasTool() {
  return useContext(CanvasToolContext);
}
