const SEARCH_BASE = 'https://openlibrary.org/search.json';
const COVER_BASE = 'https://covers.openlibrary.org/b';

export type CoverCandidate = {
  coverUrl: string;
  coverId: number;
};

export async function findCoverByTitleAuthor(
  title: string,
  author: string,
): Promise<CoverCandidate | null> {
  try {
    const params = new URLSearchParams({ title, author, limit: '5', fields: 'cover_i,isbn' });
    const res = await fetch(`${SEARCH_BASE}?${params}`);
    if (!res.ok) return null;
    const data = await res.json() as { docs?: Array<{ cover_i?: number; isbn?: string[] }> };

    for (const doc of data.docs ?? []) {
      if (doc.cover_i) {
        return {
          coverId: doc.cover_i,
          coverUrl: `${COVER_BASE}/id/${doc.cover_i}-L.jpg`,
        };
      }
      if (doc.isbn?.length) {
        return {
          coverId: 0,
          coverUrl: `${COVER_BASE}/isbn/${doc.isbn[0]}-L.jpg`,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function coverUrlToDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size < 1000) return null; // Open Library returns tiny placeholder for missing covers

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
