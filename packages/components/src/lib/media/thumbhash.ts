/**
 * ThumbHash decoding, vendored from https://github.com/evanw/thumbhash
 * (MIT, Copyright (c) 2023 Evan Wallace). Pure, so it runs on the server too.
 * Imported only by callers that use it, so `Image` stays free of it.
 *
 * @module
 */

/*
 * Copyright (c) 2023 Evan Wallace
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { ImagePlaceholder } from './image-placeholder.ts';

interface Rgba {
  readonly w: number;
  readonly h: number;
  readonly rgba: Uint8Array;
}

/** The average colour a ThumbHash encodes, each channel from 0 to 1. */
export interface ThumbHashColour {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

/** The original image's approximate aspect ratio (width / height). */
export const thumbHashAspectRatio = (hash: Uint8Array): number => {
  const header = hash[3] ?? 0;
  const hasAlpha = ((hash[2] ?? 0) & 0x80) !== 0;
  const isLandscape = ((hash[4] ?? 0) & 0x80) !== 0;
  const lx = isLandscape ? (hasAlpha ? 5 : 7) : header & 7;
  const ly = isLandscape ? header & 7 : hasAlpha ? 5 : 7;
  return lx / ly;
};

/** The average colour of a ThumbHash. RGB is not premultiplied by alpha. */
export const thumbHashAverage = (hash: Uint8Array): ThumbHashColour => {
  const header = (hash[0] ?? 0) | ((hash[1] ?? 0) << 8) | ((hash[2] ?? 0) << 16);
  const l = (header & 63) / 63;
  const p = ((header >> 6) & 63) / 31.5 - 1;
  const q = ((header >> 12) & 63) / 31.5 - 1;
  const hasAlpha = header >> 23 !== 0;
  const a = hasAlpha ? ((hash[5] ?? 0) & 15) / 15 : 1;
  const b = l - (2 / 3) * p;
  const r = (3 * l - b + q) / 2;
  const g = r - q;
  return { r: clamp(r), g: clamp(g), b: clamp(b), a };
};

/** The constants at the head of a ThumbHash. */
const readHeader = (hash: Uint8Array) => {
  const byte = (index: number): number => hash[index] ?? 0;
  const header24 = byte(0) | (byte(1) << 8) | (byte(2) << 16);
  const header16 = byte(3) | (byte(4) << 8);
  const hasAlpha = header24 >> 23 !== 0;
  const isLandscape = header16 >> 15 !== 0;
  return {
    byte,
    hasAlpha,
    lDc: (header24 & 63) / 63,
    pDc: ((header24 >> 6) & 63) / 31.5 - 1,
    qDc: ((header24 >> 12) & 63) / 31.5 - 1,
    lScale: ((header24 >> 18) & 31) / 31,
    pScale: ((header16 >> 3) & 63) / 63,
    qScale: ((header16 >> 9) & 63) / 63,
    lx: Math.max(3, isLandscape ? (hasAlpha ? 5 : 7) : header16 & 7),
    ly: Math.max(3, isLandscape ? header16 & 7 : hasAlpha ? 5 : 7),
    aDc: hasAlpha ? (byte(5) & 15) / 15 : 1,
    aScale: (byte(5) >> 4) / 15,
  };
};

/** The cosine basis `cos(π / size · (at + 0.5) · k)` for `k` below `count`. */
const cosines = (count: number, size: number, at: number): number[] =>
  Array.from({ length: count }, (_, k) => Math.cos((Math.PI / size) * (at + 0.5) * k));

/** One channel's AC terms at a pixel: the triangle of `nx` × `ny` coefficients, DC excluded. */
const acSum = (
  ac: readonly number[],
  fx: readonly number[],
  fy: readonly number[],
  nx: number,
  ny: number,
): number => {
  let sum = 0;
  for (let cy = 0, j = 0; cy < ny; cy++) {
    const fy2 = (fy[cy] ?? 0) * 2;
    for (let cx = cy === 0 ? 1 : 0; cx * ny < nx * (ny - cy); cx++, j++) {
      sum += (ac[j] ?? 0) * (fx[cx] ?? 0) * fy2;
    }
  }
  return sum;
};

/** Decode a ThumbHash to an image at most 32 pixels on its longer side. */
export const thumbHashToRgba = (hash: Uint8Array): Rgba => {
  const { byte, hasAlpha, lDc, pDc, qDc, lScale, pScale, qScale, lx, ly, aDc, aScale } =
    readHeader(hash);

  // The varying factors; saturation is boosted 1.25x to offset quantisation.
  const acStart = hasAlpha ? 6 : 5;
  let acIndex = 0;
  const decodeChannel = (nx: number, ny: number, scale: number): number[] => {
    const ac: number[] = [];
    for (let cy = 0; cy < ny; cy++) {
      for (let cx = cy === 0 ? 1 : 0; cx * ny < nx * (ny - cy); cx++) {
        const nibble = (byte(acStart + (acIndex >> 1)) >> ((acIndex & 1) << 2)) & 15;
        acIndex++;
        ac.push((nibble / 7.5 - 1) * scale);
      }
    }
    return ac;
  };
  const lAc = decodeChannel(lx, ly, lScale);
  const pAc = decodeChannel(3, 3, pScale * 1.25);
  const qAc = decodeChannel(3, 3, qScale * 1.25);
  const aAc = hasAlpha ? decodeChannel(5, 5, aScale) : [];

  const ratio = thumbHashAspectRatio(hash);
  const w = Math.round(ratio > 1 ? 32 : 32 * ratio);
  const h = Math.round(ratio > 1 ? 32 / ratio : 32);
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0, i = 0; y < h; y++) {
    const fy = cosines(Math.max(ly, hasAlpha ? 5 : 3), h, y);
    for (let x = 0; x < w; x++, i += 4) {
      const fx = cosines(Math.max(lx, hasAlpha ? 5 : 3), w, x);
      const l = lDc + acSum(lAc, fx, fy, lx, ly);
      const p = pDc + acSum(pAc, fx, fy, 3, 3);
      const q = qDc + acSum(qAc, fx, fy, 3, 3);
      const a = aDc + (hasAlpha ? acSum(aAc, fx, fy, 5, 5) : 0);

      const b = l - (2 / 3) * p;
      const r = (3 * l - b + q) / 2;
      const g = r - q;
      rgba[i] = 255 * clamp(r);
      rgba[i + 1] = 255 * clamp(g);
      rgba[i + 2] = 255 * clamp(b);
      rgba[i + 3] = 255 * clamp(a);
    }
  }
  return { w, h, rgba };
};

const CRC_TABLE = [
  0, 498536548, 997073096, 651767980, 1994146192, 1802195444, 1303535960, 1342533948, -306674912,
  -267414716, -690576408, -882789492, -1687895376, -2032938284, -1609899400, -1111625188,
] as const;

/** An uncompressed PNG data URL for a small RGBA image (at most 100 pixels a side). */
export const rgbaToDataUrl = ({ w, h, rgba }: Rgba): string => {
  const row = w * 4 + 1;
  const idat = 6 + h * (5 + row);
  const bytes: number[] = [
    137,
    80,
    78,
    71,
    13,
    10,
    26,
    10,
    0,
    0,
    0,
    13,
    73,
    72,
    68,
    82,
    0,
    0,
    w >> 8,
    w & 255,
    0,
    0,
    h >> 8,
    h & 255,
    8,
    6,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    idat >>> 24,
    (idat >> 16) & 255,
    (idat >> 8) & 255,
    idat & 255,
    73,
    68,
    65,
    84,
    120,
    1,
  ];
  let a = 1;
  let b = 0;
  for (let y = 0, i = 0, end = row - 1; y < h; y++, end += row - 1) {
    bytes.push(y + 1 < h ? 0 : 1, row & 255, row >> 8, ~row & 255, (row >> 8) ^ 255, 0);
    for (b = (b + a) % 65521; i < end; i++) {
      const u = (rgba[i] ?? 0) & 255;
      bytes.push(u);
      a = (a + u) % 65521;
      b = (b + a) % 65521;
    }
  }
  bytes.push(
    b >> 8,
    b & 255,
    a >> 8,
    a & 255,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    73,
    69,
    78,
    68,
    174,
    66,
    96,
    130,
  );
  for (const [start, stop] of [
    [12, 29],
    [37, 41 + idat],
  ] as const) {
    let c = ~0;
    for (let i = start; i < stop; i++) {
      c ^= bytes[i] ?? 0;
      c = (c >>> 4) ^ (CRC_TABLE[c & 15] ?? 0);
      c = (c >>> 4) ^ (CRC_TABLE[c & 15] ?? 0);
    }
    c = ~c;
    bytes[stop] = c >>> 24;
    bytes[stop + 1] = (c >> 16) & 255;
    bytes[stop + 2] = (c >> 8) & 255;
    bytes[stop + 3] = c & 255;
  }
  return `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`;
};

/** The bytes of a base64 ThumbHash, as image pipelines store it. */
export const thumbHashBytes = (hash: string): Uint8Array =>
  Uint8Array.from(atob(hash), (character) => character.charCodeAt(0));

const channel = (value: number): number => Math.round(value * 255);

/**
 * An `Image` placeholder from a base64 ThumbHash: the decoded preview, over
 * its average colour.
 */
export const thumbHashPlaceholder = (hash: string): ImagePlaceholder => {
  const bytes = thumbHashBytes(hash);
  const { r, g, b, a } = thumbHashAverage(bytes);
  return {
    kind: 'lqip',
    src: rgbaToDataUrl(thumbHashToRgba(bytes)),
    color: `rgb(${channel(r)} ${channel(g)} ${channel(b)} / ${a.toFixed(2)})`,
  };
};
