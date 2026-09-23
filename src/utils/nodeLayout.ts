// Canonical grid placement for canvas nodes.
//
// Extracted (L3) so new flows share one positioning helper instead of adding yet
// another copy of the col/row grid. The same formula is currently duplicated in
// AddBookModal (`nextPosition`), PlusMenu (`newNodePosition`), ReadingCanvas
// (`buildInitialPosition`) and locusMigration (`gridPosition`); those four are
// intentionally left untouched this sprint — the goal is only to avoid a fifth copy.

const ORIGIN = 60;
const COLS = 4;
const COL_STRIDE = 248; // node width + horizontal gap
const ROW_STRIDE = 220; // node height + vertical gap

/** Position of the `index`-th node laid out left-to-right, top-to-bottom. */
export function nodeGridPosition(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return { x: ORIGIN + col * COL_STRIDE, y: ORIGIN + row * ROW_STRIDE };
}
