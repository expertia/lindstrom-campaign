/**
 * Pomocné funkce pro práci s Google Drive URL.
 *
 * Drive sdílecí URL nejsou přímo embeddovatelné jako <img src>. Lze ale použít
 * https://drive.google.com/thumbnail?id=<ID>&sz=w<N>, který vrací statický
 * náhled (image i video). Soubor musí být sdílen "Kdokoli s odkazem".
 */

const FILE_PATH_RE = /\/file\/d\/([a-zA-Z0-9_-]+)/;
const ID_QUERY_RE = /[?&]id=([a-zA-Z0-9_-]+)/;

export function extractDriveFileId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m1 = url.match(FILE_PATH_RE);
  if (m1) return m1[1];
  const m2 = url.match(ID_QUERY_RE);
  if (m2) return m2[1];
  return null;
}

export function driveThumbnailUrl(fileId: string, sizePx = 400): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${sizePx}`;
}

export function isDriveUrl(url: string | null | undefined): boolean {
  return Boolean(url && /(?:^|\/\/)(?:drive|docs)\.google\.com/.test(url));
}
