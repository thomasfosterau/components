import { describe, expect, test } from 'vite-plus/test';
import {
  clampRect,
  defaultMovedAnnouncement,
  defaultPanelLimits,
  placeOf,
  rescaleRect,
  resizeRect,
  snapRect,
} from '../../src/lib/ui/floating-panel.ts';

const bounds = { width: 600, height: 400 };
const limits = defaultPanelLimits;

describe('clampRect', () => {
  test('keeps the rect inside the boundary and within its limits', () => {
    expect(clampRect({ x: 550, y: -20, width: 100, height: 50 }, bounds, limits)).toEqual({
      x: 440,
      y: 0,
      width: 160,
      height: 96,
    });
  });

  test('never grows past the boundary', () => {
    expect(clampRect({ x: 0, y: 0, width: 900, height: 900 }, bounds, limits)).toEqual({
      x: 0,
      y: 0,
      width: 600,
      height: 400,
    });
  });

  test('leaves the rect alone while the boundary is unmeasured', () => {
    const rect = { x: 5, y: 5, width: 10, height: 10 };
    expect(clampRect(rect, { width: 0, height: 0 }, limits)).toBe(rect);
  });
});

test('resizing stops at the boundary edge', () => {
  expect(resizeRect({ x: 500, y: 0, width: 160, height: 100 }, 50, 0, bounds, limits).width).toBe(
    100,
  );
});

test('snapping pulls a rect near an edge flush to it', () => {
  expect(snapRect({ x: 10, y: 230, width: 200, height: 150 }, bounds)).toEqual({
    x: 0,
    y: 250,
    width: 200,
    height: 150,
  });
  expect(snapRect({ x: 100, y: 100, width: 200, height: 150 }, bounds)).toEqual({
    x: 100,
    y: 100,
    width: 200,
    height: 150,
  });
});

test('a boundary resize keeps the rect in proportion', () => {
  const rect = { x: 400, y: 0, width: 200, height: 150 };
  expect(rescaleRect(rect, bounds, { width: 1000, height: 400 }, limits)).toEqual({
    x: 800,
    y: 0,
    width: 200,
    height: 150,
  });
});

test('the move announcement names the third of the boundary', () => {
  expect(defaultMovedAnnouncement(placeOf({ x: 400, y: 0, width: 200, height: 100 }, bounds))).toBe(
    'Moved to top right',
  );
  expect(
    defaultMovedAnnouncement(placeOf({ x: 200, y: 150, width: 200, height: 100 }, bounds)),
  ).toBe('Moved to the centre');
  expect(defaultMovedAnnouncement(placeOf({ x: 0, y: 150, width: 200, height: 100 }, bounds))).toBe(
    'Moved to the left',
  );
});
