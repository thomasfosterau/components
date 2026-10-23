import { expect, test } from 'vite-plus/test';
import { clampToNeighbours, pageStep } from '../../src/lib/fields/slider-keys.ts';

test('a page is a tenth of the scale, in whole steps', () => {
  expect(pageStep(50, 1, { min: 0, max: 100, step: 1 })).toBe(60);
  expect(pageStep(50, -1, { min: 0, max: 100, step: 3 })).toBe(41);
});

test('a page is never less than one step', () => {
  expect(pageStep(2, 1, { min: 0, max: 10, step: 5 })).toBe(7);
});

test('with snap points a page moves a tenth of the points, at least one', () => {
  const step = [0, 5, 10, 50];
  expect(pageStep(5, 1, { min: 0, max: 50, step })).toBe(10);
  expect(pageStep(7, -1, { min: 0, max: 50, step })).toBe(0);
  expect(pageStep(50, 1, { min: 0, max: 50, step })).toBe(50);
});

test('a thumb is clamped between its neighbours, or the ends', () => {
  const scale = { min: 0, max: 100, step: 1 };
  expect(clampToNeighbours([20, 60], 0, 75, scale)).toBe(60);
  expect(clampToNeighbours([20, 60], 1, 10, scale)).toBe(20);
  expect(clampToNeighbours([20, 60], 1, 140, scale)).toBe(100);
  expect(clampToNeighbours([20], 0, -5, scale)).toBe(0);
});
