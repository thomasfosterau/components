/**
 * Browser tests for `MapShapeView` — the drawing, and specifically the rule
 * that the affordance matches the capability.
 *
 * The counts below are what a reader SEES: a selected outline that cannot be
 * reshaped gets one indicator per corner and nothing else; one that can gets a
 * grip per corner plus a midpoint handle per edge, because dragging a midpoint
 * is how a new corner is made. A handle that looks draggable and is not is
 * worse than no handle, and this is where that stops being a comment.
 *
 * @module tests/maps/MapShapeView
 */

import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { MapShape } from '../../src/lib/maps/shapes.ts';
import ShapeViewFixture from './fixtures/ShapeViewFixture.svelte';

const base = {
  rotation: 0,
  zIndex: 0,
  strokeColor: 'currentColor',
  strokeWidth: 1.5,
  opacity: 1,
  locked: false,
} as const;

/** A four-corner outline, so "one handle per corner" is a number worth counting. */
const area: MapShape = {
  ...base,
  id: 'area',
  type: 'polygon',
  position: { x: 40, y: 40 },
  fillColor: 'var(--color-chart-1)',
  points: [
    { x: 0, y: 0 },
    { x: 120, y: 0 },
    { x: 120, y: 60 },
    { x: 0, y: 60 },
  ],
};

const handles = (container: HTMLElement): number => container.querySelectorAll('circle').length;

describe('handles', () => {
  test('draws none at all when the shape is not selected', async () => {
    const screen = await render(ShapeViewFixture, { shape: area });

    expect(handles(screen.container)).toBe(0);
  });

  test('draws one indicator per corner when it is selected but read-only', async () => {
    const screen = await render(ShapeViewFixture, { shape: area, selected: true });

    expect(handles(screen.container)).toBe(4);
  });

  test('adds a midpoint handle per edge once the corners can actually be dragged', async () => {
    const screen = await render(ShapeViewFixture, {
      shape: area,
      selected: true,
      editable: true,
    });

    // Four corners plus four edges — a polygon's closing edge included, which
    // is what makes the whole outline reachable.
    expect(handles(screen.container)).toBe(8);
  });
});

test('draws a marker as one disc, with no outline handles', async () => {
  const { points: _outline, ...rest } = area;
  const marker: MapShape = { ...rest, type: 'marker', radius: 9 };
  const screen = await render(ShapeViewFixture, { shape: marker, selected: true, editable: true });

  expect(screen.container.querySelectorAll('circle')).toHaveLength(1);
  expect(screen.container.querySelectorAll('path')).toHaveLength(0);
});

test('leaves a line unfilled — SVG would otherwise close it and paint the gap', async () => {
  const screen = await render(ShapeViewFixture, {
    shape: { ...area, type: 'line', fillColor: 'var(--color-chart-2)' },
  });

  expect(screen.container.querySelector('path')?.getAttribute('fill')).toBe('none');
});

test('renders a shape’s label as text the reader can see', async () => {
  const screen = await render(ShapeViewFixture, { shape: { ...area, label: 'Bed 1' } });

  await expect.element(screen.getByText('Bed 1')).toBeInTheDocument();
});
