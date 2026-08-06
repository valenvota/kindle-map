/**
 * Downscale an uploaded image before it goes into IndexedDB (Sprint 4).
 *
 * Canvas image nodes store their pixels inline as a data URI (same pattern as
 * Book.coverImage), so a full-res phone photo would bloat the DB and slow the
 * PNG export. We cap the longest edge at MAX_EDGE and re-encode. PNGs keep their
 * alpha; everything else becomes JPEG. Returns the data URI plus the scaled
 * pixel dimensions so the caller can size the node to the image's aspect ratio.
 */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

export type DownscaledImage = {
  dataUrl: string;
  width: number;
  height: number;
};

export function downscaleImage(file: File): Promise<DownscaledImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Could not decode the image file.'));
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
        const outW = Math.max(1, Math.round(w * scale));
        const outH = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not available.')); return; }
        ctx.drawImage(img, 0, 0, outW, outH);

        const isPng = file.type === 'image/png';
        const dataUrl = isPng
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', JPEG_QUALITY);

        resolve({ dataUrl, width: outW, height: outH });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Fit an image's pixel size into a default on-canvas box, keeping its aspect. */
export function fitNodeSize(width: number, height: number, maxW = 260, maxH = 260): { width: number; height: number } {
  const scale = Math.min(1, maxW / width, maxH / height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
