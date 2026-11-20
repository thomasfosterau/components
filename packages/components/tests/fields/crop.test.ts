import { describe, expect, test } from 'vite-plus/test';
import {
  areaOf,
  clampView,
  cropSize,
  defaultCropReadout,
  defaultStraightenText,
  initialView,
  panView,
  readoutOf,
  rotateView,
  viewOf,
  zoomView,
  type CropFrame,
} from '../../src/lib/fields/crop.ts';

const frame: CropFrame = {
  source: { width: 1200, height: 800 },
  aspect: 1,
  minZoom: 1,
  maxZoom: 4,
};
const start = initialView(frame);

describe('cover constraint', () => {
  test('panning never uncovers the frame', () => {
    expect(areaOf(frame, panView(frame, start, { x: -5000, y: 0 })).x).toBe(0);
    expect(areaOf(frame, panView(frame, start, { x: 5000, y: 5000 }))).toMatchObject({
      x: 400,
      y: 0,
    });
  });

  test('zoom stays in range', () => {
    expect(clampView(frame, { ...start, zoom: 10 }).zoom).toBe(4);
    expect(clampView(frame, { ...start, zoom: 0.2 }).zoom).toBe(1);
  });

  test('straightened, the crop’s corners stay on the image', () => {
    const tilted = clampView(frame, { ...start, straighten: 20, centre: { x: 1000, y: 1000 } });
    const crop = cropSize(frame, tilted);
    const angle = (-20 * Math.PI) / 180;
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      const cx = (sx * crop.width) / 2;
      const cy = (sy * crop.height) / 2;
      const x = tilted.centre.x + cx * Math.cos(angle) - cy * Math.sin(angle);
      const y = tilted.centre.y + cx * Math.sin(angle) + cy * Math.cos(angle);
      expect(Math.abs(x)).toBeLessThanOrEqual(600 + 1e-6);
      expect(Math.abs(y)).toBeLessThanOrEqual(400 + 1e-6);
    }
  });
});

test('zooming about a point keeps that point still', () => {
  const zoomed = zoomView(frame, start, 2, { x: 200, y: 0 });
  // The point 200 px right of centre (x = 800 in the image) stays 100 crop-pixels right of the new centre.
  expect(zoomed.centre.x + 100).toBeCloseTo(200);
});

test('four quarter-turns come back to the start', () => {
  const panned = panView(frame, start, { x: 100, y: 0 });
  const turned = rotateView(frame, rotateView(frame, rotateView(frame, rotateView(frame, panned))));
  expect(turned.rotation).toBe(0);
  expect(turned.centre.x).toBeCloseTo(100);
});

test('a saved area reopens as the same view', () => {
  const view = panView(frame, zoomView(frame, start, 2, { x: 0, y: 0 }), { x: -50, y: 30 });
  const area = areaOf(frame, view);
  const reopened = viewOf(frame, area);
  expect(reopened.zoom).toBeCloseTo(view.zoom);
  expect(reopened.centre.x).toBeCloseTo(view.centre.x);
  expect(reopened.centre.y).toBeCloseTo(view.centre.y);
});

test('the readout says how much is shown and where', () => {
  expect(defaultCropReadout(readoutOf(frame, start))).toBe('Showing 67% of the width, centred');
  expect(defaultCropReadout(readoutOf(frame, panView(frame, start, { x: 500, y: 0 })))).toBe(
    'Showing 67% of the width, towards the right',
  );
  expect(defaultStraightenText(-1)).toBe('1 degree anticlockwise');
});
