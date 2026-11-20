/**
 * A QR code as data `QRCode` draws: the encoder's module grid turned into
 * one SVG path, one horizontal run of dark modules per subpath.
 *
 * @module
 */

import { Ecc, QrCode } from './qrcodegen.ts';

/** Error correction: about 7, 15, 25 or 30 percent of the code can be lost. */
export type QrEcc = 'L' | 'M' | 'Q' | 'H';

const ECC: Record<QrEcc, Ecc> = { L: Ecc.LOW, M: Ecc.MEDIUM, Q: Ecc.QUARTILE, H: Ecc.HIGH };
const LEVELS: readonly QrEcc[] = ['L', 'M', 'Q', 'H'];

/** An encoded code, ready to draw. */
export interface QrDrawing {
  /** Modules per side, quiet zone included: the SVG `viewBox` side. */
  readonly extent: number;
  /** One `d` for every dark module, offset by the quiet zone. */
  readonly path: string;
  /** The level actually used, which may be higher than asked when it costs no size. */
  readonly ecc: QrEcc;
  /** The QR version, 1 to 40. */
  readonly version: number;
}

/** `ecc`, raised to at least `floor`. */
export const atLeast = (ecc: QrEcc, floor: QrEcc): QrEcc =>
  LEVELS.indexOf(ecc) >= LEVELS.indexOf(floor) ? ecc : floor;

/** The dark modules of `code` as one path: a rectangle per horizontal run. */
const runsPath = (code: QrCode, margin: number): string => {
  const parts: string[] = [];
  for (let y = 0; y < code.size; y++) {
    let x = 0;
    while (x < code.size) {
      if (!code.getModule(x, y)) {
        x++;
        continue;
      }
      const start = x;
      while (x < code.size && code.getModule(x, y)) x++;
      parts.push(`M${start + margin} ${y + margin}h${x - start}v1h-${x - start}z`);
    }
  }
  return parts.join('');
};

/**
 * Encode `value` (UTF-8, the smallest version that fits) and draw it, or
 * `undefined` when it is too long for any QR code at that level.
 */
export const drawQr = (value: string, ecc: QrEcc, margin: number): QrDrawing | undefined => {
  let code: QrCode;
  try {
    code = QrCode.encodeText(value, ECC[ecc]);
  } catch {
    return undefined;
  }
  const level = LEVELS[code.errorCorrectionLevel.ordinal] ?? ecc;
  return {
    extent: code.size + 2 * margin,
    path: runsPath(code, margin),
    ecc: level,
    version: code.version,
  };
};
