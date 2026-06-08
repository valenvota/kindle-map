// Generates a deterministic ID from content — stable across re-imports.
// Uses djb2 hash (no crypto dependency, runs synchronously, collision risk
// is acceptable for this volume of highlights).
function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash.toString(36);
}

export function generateStableId(parts: (string | undefined)[]): string {
  const normalized = parts
    .map((p) => (p ?? '').trim().toLowerCase())
    .join('|');
  return djb2(normalized);
}
