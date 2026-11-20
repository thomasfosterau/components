/**
 * The colour maths behind the colour fields: hex, `rgb()`, `hsl()` and
 * `oklch()` parsed to sRGB and back, HSV for the custom editor, and the ink
 * (black or white) that reads best on a colour. No colour library: this is
 * all they need.
 *
 * @module
 */

/** An sRGB colour, each channel and `alpha` in 0–1. Out-of-gamut colours are clipped. */
export interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly alpha: number;
}

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

const encode = (linear: number): number => {
  const c = clamp01(linear);
  return c <= 0.003_130_8 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
};

const decode = (channel: number): number =>
  channel <= 0.040_45 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

function parseHex(hex: string): Rgba | undefined {
  if (!/^[\da-f]+$/i.test(hex) || ![3, 4, 6, 8].includes(hex.length)) return undefined;
  const digits =
    hex.length <= 4 ? (hex.match(/./g) ?? []).map((d) => d + d) : (hex.match(/../g) ?? []);
  const [r = 0, g = 0, b = 0, alpha = 255] = digits.map((pair) => Number.parseInt(pair, 16));
  return { r: r / 255, g: g / 255, b: b / 255, alpha: alpha / 255 };
}

/** One component: a percentage scaled by `percentOf`, a hue angle in degrees, `none` as 0, or a number. */
function component(token: string, percentOf: number): number | undefined {
  if (token === 'none') return 0;
  const match = /^(-?[\d.]+(?:e-?\d+)?)(%|deg|turn|rad)?$/i.exec(token);
  if (match === null) return undefined;
  const n = Number(match[1]);
  if (Number.isNaN(n)) return undefined;
  switch (match[2]?.toLowerCase()) {
    case '%':
      return (n / 100) * percentOf;
    case 'turn':
      return n * 360;
    case 'rad':
      return (n * 180) / Math.PI;
    default:
      return n;
  }
}

function hslToRgb(h: number, s: number, l: number): readonly [number, number, number] {
  const f = (k: number): number => {
    const n = (k + h / 30) % 12;
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(n - 3, 9 - n, 1));
  };
  return [f(0), f(8), f(4)];
}

function oklchToRgb(l: number, c: number, h: number): readonly [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const lms = [
    l + 0.396_337_777_4 * a + 0.215_803_757_3 * b,
    l - 0.105_561_345_8 * a - 0.063_854_172_8 * b,
    l - 0.089_484_177_5 * a - 1.291_485_548 * b,
  ].map((n) => n ** 3);
  const [x = 0, y = 0, z = 0] = lms;
  return [
    encode(4.076_741_662_1 * x - 3.307_711_591_3 * y + 0.230_969_929_2 * z),
    encode(-1.268_438_004_6 * x + 2.609_757_401_1 * y - 0.341_319_396_5 * z),
    encode(-0.004_196_086_3 * x - 0.703_418_614_7 * y + 1.707_614_701 * z),
  ];
}

/**
 * Parse a CSS colour in hex (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`),
 * `rgb()`, `hsl()` or `oklch()`, in modern or comma syntax. Named colours,
 * `var()` and other functions are `undefined`.
 */
export function parseColor(css: string): Rgba | undefined {
  const text = css.trim().toLowerCase();
  if (text.startsWith('#')) return parseHex(text.slice(1));
  const fn = /^(rgba?|hsla?|oklch)\(([^()]*)\)$/.exec(text);
  if (fn === null) return undefined;
  const kind = (fn[1] ?? '').replace(/a$/, '');
  const tokens = (fn[2] ?? '').split(/[\s,/]+/).filter((t) => t !== '');
  if (tokens.length !== 3 && tokens.length !== 4) return undefined;
  const scales: Record<string, readonly number[]> = {
    rgb: [255, 255, 255],
    hsl: [360, 100, 100],
    oklch: [1, 0.4, 360],
  };
  const values = tokens.slice(0, 3).map((t, i) => component(t, scales[kind]?.[i] ?? 1));
  const alpha = tokens[3] === undefined ? 1 : component(tokens[3], 1);
  const [p, q, s] = values;
  if (p === undefined || q === undefined || s === undefined || alpha === undefined)
    return undefined;
  const [r, g, b] =
    kind === 'rgb'
      ? [p / 255, q / 255, s / 255]
      : kind === 'hsl'
        ? hslToRgb(((p % 360) + 360) % 360, clamp01(q / 100), clamp01(s / 100))
        : oklchToRgb(p, q, s);
  return { r: clamp01(r), g: clamp01(g), b: clamp01(b), alpha: clamp01(alpha) };
}

/** WCAG relative luminance of an sRGB colour, 0 (black) to 1 (white). */
function luminance({ r, g, b }: Rgba): number {
  return 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b);
}

/**
 * The ink, black or white, with the higher WCAG contrast against `css`
 * (alpha ignored); `undefined` when `css` can't be parsed.
 */
export function contrastingInk(css: string): '#000000' | '#ffffff' | undefined {
  const colour = parseColor(css);
  if (colour === undefined) return undefined;
  const l = luminance(colour);
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? '#000000' : '#ffffff';
}

/** A colour in HSV, as the custom editor edits it: `h` in degrees (0–360), `s`, `v` and `alpha` in 0–1. */
export interface Hsva {
  readonly h: number;
  readonly s: number;
  readonly v: number;
  readonly alpha: number;
}

/** sRGB to HSV; `hue` is kept for greys, whose hue is undefined. */
export function rgbToHsv({ r, g, b, alpha }: Rgba, hue = 0): Hsva {
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  const s = max === 0 ? 0 : delta / max;
  if (delta === 0) return { h: hue, s, v: max, alpha };
  const sector =
    max === r
      ? (g - b) / delta + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4;
  return { h: sector * 60, s, v: max, alpha };
}

/** HSV to sRGB. */
export function hsvToRgb({ h, s, v, alpha }: Hsva): Rgba {
  const f = (n: number): number => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: f(5), g: f(3), b: f(1), alpha };
}

/** The serialisations `formatColor` writes. */
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch';

const round = (n: number, places = 0): number => {
  const factor = 10 ** places;
  return Math.round(n * factor) / factor;
};

const hex2 = (n: number): string =>
  Math.round(clamp01(n) * 255)
    .toString(16)
    .padStart(2, '0');

function rgbToHsl({ r, g, b }: Rgba): readonly [number, number, number] {
  const { h, v } = rgbToHsv({ r, g, b, alpha: 1 });
  const l = v - (v - Math.min(r, g, b)) / 2;
  const s = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
  return [h, s, l];
}

function rgbToOklch({ r, g, b }: Rgba): readonly [number, number, number] {
  const [x, y, z] = [decode(r), decode(g), decode(b)];
  const lCone = Math.cbrt(0.412_221_470_8 * x + 0.536_332_536_3 * y + 0.051_445_992_9 * z);
  const mCone = Math.cbrt(0.211_903_498_2 * x + 0.680_699_545_1 * y + 0.107_396_956_6 * z);
  const sCone = Math.cbrt(0.088_302_461_9 * x + 0.281_718_837_6 * y + 0.629_978_700_5 * z);
  const l = 0.210_454_255_3 * lCone + 0.793_617_785 * mCone - 0.004_072_046_8 * sCone;
  const a = 1.977_998_495_1 * lCone - 2.428_592_205 * mCone + 0.450_593_709_9 * sCone;
  const bb = 0.025_904_037_1 * lCone + 0.782_771_766_2 * mCone - 0.808_675_766 * sCone;
  const c = Math.hypot(a, bb);
  const h = c < 1e-4 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return [l, c, h];
}

/**
 * Serialise `colour` as CSS. Alpha is written only when `withAlpha` is set
 * and the colour is not opaque: `#rrggbbaa`, or a `/ alpha` term.
 */
export function formatColor(colour: Rgba, format: ColorFormat, withAlpha = false): string {
  const translucent = withAlpha && colour.alpha < 1;
  const slash = translucent ? ` / ${round(colour.alpha, 2)}` : '';
  switch (format) {
    case 'rgb':
      return `rgb(${round(colour.r * 255)} ${round(colour.g * 255)} ${round(colour.b * 255)}${slash})`;
    case 'hsl': {
      const [h, s, l] = rgbToHsl(colour);
      return `hsl(${round(h) % 360} ${round(s * 100, 1)}% ${round(l * 100, 1)}%${slash})`;
    }
    case 'oklch': {
      const [l, c, h] = rgbToOklch(colour);
      return `oklch(${round(l * 100, 2)}% ${round(c, 4)} ${round(h, 2) % 360}${slash})`;
    }
    default:
      return `#${hex2(colour.r)}${hex2(colour.g)}${hex2(colour.b)}${translucent ? hex2(colour.alpha) : ''}`;
  }
}
