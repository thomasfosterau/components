import { describe, expect, test } from 'vite-plus/test';
import {
  clampPan,
  isZoomed,
  panBy,
  pinch,
  pinchGeometry,
  swipeIntent,
  toggleZoom,
  unzoomed,
  zoomAbout,
} from '../../src/lib/media/zoom.ts';

const image = { width: 400, height: 300 };
const stage = { width: 400, height: 400 };

describe('clampPan', () => {
  test('keeps a fitted image centred', () => {
    expect(clampPan({ scale: 1, x: 50, y: -20 }, image, stage)).toEqual(unzoomed);
  });

  test('lets a zoomed image move only as far as its overhang', () => {
    // At 2×: 800 × 600 in a 400 × 400 stage overhangs 200 each side and 100 top and bottom.
    expect(clampPan({ scale: 2, x: 500, y: -500 }, image, stage)).toEqual({
      scale: 2,
      x: 200,
      y: -100,
    });
  });
});

describe('zoomAbout', () => {
  test('about the centre, scales without panning', () => {
    expect(zoomAbout(unzoomed, 2, { x: 0, y: 0 }, 4, image, stage)).toEqual({
      scale: 2,
      x: 0,
      y: 0,
    });
  });

  test('about a point, keeps that point under the cursor', () => {
    // The image point at +100 from centre moves to +200 at 2×; the offset brings it back to +100.
    expect(zoomAbout(unzoomed, 2, { x: 100, y: 0 }, 4, image, stage)).toEqual({
      scale: 2,
      x: -100,
      y: 0,
    });
  });

  test('clamps the scale to 1–maxZoom, and scale 1 drops the offset', () => {
    expect(zoomAbout(unzoomed, 9, { x: 0, y: 0 }, 4, image, stage).scale).toBe(4);
    expect(zoomAbout({ scale: 2, x: 100, y: 50 }, 0.5, { x: 0, y: 0 }, 4, image, stage)).toEqual(
      unzoomed,
    );
  });
});

test('panBy clamps', () => {
  expect(panBy({ scale: 2, x: 0, y: 0 }, -500, 30, image, stage)).toEqual({
    scale: 2,
    x: -200,
    y: 30,
  });
});

test('toggleZoom goes to 2× when fitted and back to fitted when zoomed', () => {
  const zoomed = toggleZoom(unzoomed, { x: 0, y: 0 }, 4, image, stage);
  expect(zoomed.scale).toBe(2);
  expect(isZoomed(zoomed)).toBe(true);
  expect(toggleZoom(zoomed, { x: 0, y: 0 }, 4, image, stage)).toEqual(unzoomed);
});

describe('pinch', () => {
  test('doubling the distance about the midpoint doubles the scale', () => {
    const from = pinchGeometry({ x: -50, y: 0 }, { x: 50, y: 0 });
    const to = pinchGeometry({ x: -100, y: 0 }, { x: 100, y: 0 });
    expect(pinch(unzoomed, from, to, 4, image, stage)).toEqual({ scale: 2, x: 0, y: 0 });
  });

  test('moving the midpoint pans', () => {
    const from = pinchGeometry({ x: -50, y: 0 }, { x: 50, y: 0 });
    const to = pinchGeometry({ x: -70, y: 10 }, { x: 130, y: 10 });
    expect(pinch(unzoomed, from, to, 4, image, stage)).toEqual({ scale: 2, x: 30, y: 10 });
  });

  test('pinching in past fitted resets', () => {
    const from = pinchGeometry({ x: -100, y: 0 }, { x: 100, y: 0 });
    const to = pinchGeometry({ x: -10, y: 0 }, { x: 10, y: 0 });
    expect(pinch({ scale: 2, x: 50, y: 0 }, from, to, 4, image, stage)).toEqual(unzoomed);
  });
});

describe('swipeIntent', () => {
  test.each([
    [-80, 10, 'next'],
    [80, -10, 'previous'],
    [10, 120, 'close'],
    [20, 20, undefined],
    [10, 60, undefined],
  ] as const)('dx %d, dy %d is %s', (dx, dy, intent) => {
    expect(swipeIntent(dx, dy)).toBe(intent);
  });
});
