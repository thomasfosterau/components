import { expect, test } from 'vite-plus/test';
import { defaultKeepEnd, truncateText } from '../../src/lib/ui/truncate.ts';

// One unit per character, so widths are character counts.
const measure = (text: string): number => text.length;

test('text that fits is returned whole', () => {
  expect(truncateText('beds.geojson', 20, measure, 'middle')).toBe('beds.geojson');
});

test('the middle cut keeps the extension and fills the width', () => {
  const fitted = truncateText('IMG_20241012_153045_0412.jpg', 16, measure, 'middle');

  expect(fitted).toHaveLength(16);
  expect(fitted).toMatch(/^IMG_20.*….*\.jpg$/);
});

test('the middle cut keeps the last path segment', () => {
  const fitted = truncateText('~/garden/2024/autumn/plans/beds.geojson', 22, measure, 'middle');

  expect(fitted.endsWith('/beds.geojson')).toBe(true);
  expect(fitted.startsWith('~/garden')).toBe(true);
  expect(fitted).toHaveLength(22);
});

test('the start cut keeps the end', () => {
  expect(truncateText('feature/garden-beds-map', 10, measure, 'start')).toBe('…-beds-map');
});

test('with no room at all only the ellipsis is left', () => {
  expect(truncateText('abcdef', 1, measure, 'middle')).toBe('…');
  expect(truncateText('abcdef', 0, measure, 'start')).toBe('…');
});

test('defaultKeepEnd is the last path segment, else a short extension, else nothing', () => {
  expect(defaultKeepEnd('a/b/beds.geojson')).toBe('/beds.geojson'.length);
  expect(defaultKeepEnd('IMG_0412.jpeg')).toBe('.jpeg'.length);
  expect(defaultKeepEnd('Solanum lycopersicum')).toBe(0);
});
