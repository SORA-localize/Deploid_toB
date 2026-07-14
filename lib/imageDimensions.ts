import fs from 'node:fs';
import path from 'node:path';

/**
 * public/配下のローカル画像ファイルの実寸をファイル本体から測定する。
 * data/*.ts に寸法を手打ちしない方針（docs/planning/manufacturer-logo-usage-spec-v1.md 参照）の
 * ための唯一の測定経路。measure対象はサーバー側でのみ呼び出すこと（fsを使うため）。
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

function readPngDimensions(buf: Buffer): ImageDimensions | null {
  // PNG: 8バイトの signature の直後、IHDR チャンクの width/height (big-endian uint32) が続く
  if (buf.length < 24) return null;
  const isPng =
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47;
  if (!isPng) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readSvgDimensions(buf: Buffer): ImageDimensions | null {
  const text = buf.toString('utf8', 0, Math.min(buf.length, 4096));
  const viewBoxMatch = text.match(/viewBox=["']([^"']+)["']/i);
  if (viewBoxMatch) {
    const values = viewBoxMatch[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const width = values[2];
    const height = values[3];
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { width, height };
    }
  }
  const widthMatch = text.match(/\bwidth=["']([\d.]+)/i);
  const heightMatch = text.match(/\bheight=["']([\d.]+)/i);
  if (widthMatch && heightMatch) {
    const width = parseFloat(widthMatch[1]);
    const height = parseFloat(heightMatch[1]);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { width, height };
    }
  }
  return null;
}

function readJpegDimensions(buf: Buffer): ImageDimensions | null {
  // JPEG: SOFn マーカー(0xC0-0xC3等)の中にwidth/heightが入っている。マーカー列を素直に辿る。
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buf.length - 9) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    const isSofMarker =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSofMarker) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    const segmentLength = buf.readUInt16BE(offset + 2);
    offset += 2 + segmentLength;
  }
  return null;
}

const dimensionCache = new Map<string, ImageDimensions | null>();

/**
 * publicルートからの相対パス（例: '/images/_local-prototype/manufacturers/unitree-logo.png'）を
 * 受け取り、実ファイルを読んで幅・高さを返す。読めない場合はnull。
 */
export function measureImageDimensions(publicSrc: string): ImageDimensions | null {
  if (dimensionCache.has(publicSrc)) {
    return dimensionCache.get(publicSrc) ?? null;
  }
  if (!publicSrc.startsWith('/')) {
    dimensionCache.set(publicSrc, null);
    return null;
  }
  const publicRoot = path.resolve(process.cwd(), 'public');
  const absolutePath = path.resolve(publicRoot, publicSrc.replace(/^\/+/, ''));
  if (!absolutePath.startsWith(`${publicRoot}${path.sep}`)) {
    dimensionCache.set(publicSrc, null);
    return null;
  }
  let result: ImageDimensions | null = null;
  try {
    const buf = fs.readFileSync(absolutePath);
    result =
      readPngDimensions(buf) ?? readJpegDimensions(buf) ?? readSvgDimensions(buf) ?? null;
  } catch {
    result = null;
  }
  dimensionCache.set(publicSrc, result);
  return result;
}
