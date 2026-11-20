import { describe, expect, test } from 'vite-plus/test';
import {
  contrastingInk,
  formatColor,
  hsvToRgb,
  parseColor,
  rgbToHsv,
  type ColorFormat,
} from '../../src/lib/fields/color.ts';

const leaf = '#3a7d44';

/** `css` parsed and written back as hex, or `undefined` when it doesn't parse. */
function asHex(css: string, withAlpha = false): string | undefined {
  const parsed = parseColor(css);
  return parsed === undefined ? undefined : formatColor(parsed, 'hex', withAlpha);
}

describe('parseColor', () => {
  test.each([
    ['#3a7d44', leaf],
    ['#fff', '#ffffff'],
    ['#3A7D44', leaf],
    ['rgb(58 125 68)', leaf],
    ['rgba(58, 125, 68, 1)', leaf],
    ['rgb(100% 0% 0%)', '#ff0000'],
    ['hsl(120 100% 25%)', '#008000'],
    ['hsla(120, 100%, 25%, 1)', '#008000'],
    ['hsl(0.5turn 100% 50%)', '#00ffff'],
    ['oklch(62.8% 0.2577 29.23)', '#ff0000'],
    ['oklch(1 0 0)', '#ffffff'],
  ])('%s is %s', (css, hex) => {
    expect(asHex(css)).toBe(hex);
  });

  test.each([
    ['#3a7d4480', 0.5],
    ['#0008', 0.53],
    ['rgb(58 125 68 / 50%)', 0.5],
    ['hsl(120 100% 25% / 0.25)', 0.25],
  ])('%s has alpha %d', (css, alpha) => {
    expect(parseColor(css)?.alpha).toBeCloseTo(alpha, 2);
  });

  test.each(['red', '#zzz', '#12345', 'var(--color-primary)', 'rgb(1 2)', 'lab(50% 0 0)', ''])(
    '%j is undefined',
    (css) => {
      expect(parseColor(css)).toBeUndefined();
    },
  );
});

describe('formatColor', () => {
  const colour = { r: 58 / 255, g: 125 / 255, b: 68 / 255, alpha: 0.5 };

  test.each<[ColorFormat, boolean, string]>([
    ['hex', false, leaf],
    ['hex', true, '#3a7d4480'],
    ['rgb', true, 'rgb(58 125 68 / 0.5)'],
    ['rgb', false, 'rgb(58 125 68)'],
    ['hsl', false, 'hsl(129 36.6% 35.9%)'],
  ])('%s (alpha %s) is %s', (format, withAlpha, expected) => {
    expect(formatColor(colour, format, withAlpha)).toBe(expected);
  });

  test.each<ColorFormat>(['rgb', 'hsl', 'oklch'])('%s round-trips through parseColor', (format) => {
    expect(asHex(formatColor(colour, format, true), true)).toBe('#3a7d4480');
  });

  test('a hue that rounds up to 360 is written as 0', () => {
    expect(formatColor({ r: 1, g: 0, b: 0.001, alpha: 1 }, 'hsl')).toBe('hsl(0 100% 50%)');
  });
});

describe('HSV', () => {
  test('round-trips through sRGB', () => {
    const parsed = parseColor(leaf);
    expect(parsed).toBeDefined();
    if (parsed === undefined) return;
    const hsv = rgbToHsv(parsed);
    expect(hsv.h).toBeCloseTo(128.96, 1);
    expect(formatColor(hsvToRgb(hsv), 'hex')).toBe(leaf);
  });

  test('a grey keeps the hue it is given', () => {
    expect(rgbToHsv({ r: 0.5, g: 0.5, b: 0.5, alpha: 1 }, 200)).toEqual({
      h: 200,
      s: 0,
      v: 0.5,
      alpha: 1,
    });
  });
});

describe('contrastingInk', () => {
  test.each([
    ['#ffffff', '#000000'],
    ['#ffeb3b', '#000000'],
    ['#000000', '#ffffff'],
    [leaf, '#ffffff'],
    ['oklch(30% 0.1 260)', '#ffffff'],
  ])('on %s is %s', (css, ink) => {
    expect(contrastingInk(css)).toBe(ink);
  });

  test('is undefined for a colour it cannot parse', () => {
    expect(contrastingInk('currentColor')).toBeUndefined();
  });
});
