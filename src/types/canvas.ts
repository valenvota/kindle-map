export type CanvasNodeData = {
  id: string;
  bookId?: string;
  groupId?: string;
  type: 'book' | 'group' | 'topic';
  position: { x: number; y: number };
  width?: number;
  height?: number;
};

export type Group = {
  id: string;
  title: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
};
