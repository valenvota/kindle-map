import { createContext, useContext } from 'react';

export type CanvasTool =
  | 'select'
  | 'pan'
  | 'book'
  | 'topic'
  | 'note'
  | 'quote'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'region'
  | 'image'
  | 'pencil'
  | 'marker'
  | 'eraser';

type CanvasToolContextValue = {
  activeTool: CanvasTool;
  setActiveTool: (tool: CanvasTool) => void;
};

export const CanvasToolContext = createContext<CanvasToolContextValue>({
  activeTool: 'select',
  setActiveTool: () => {},
});

export function useCanvasTool() {
  return useContext(CanvasToolContext);
}
