import { expect, test } from 'vite-plus/test';
import {
  thumbHashAspectRatio,
  thumbHashAverage,
  thumbHashBytes,
  thumbHashPlaceholder,
  thumbHashToRgba,
} from '../../src/lib/media/thumbhash.ts';

// Encoded by the reference implementation from a 40 × 20 four-quadrant image.
const HASH = 'nvcJdJqPdXlwiHiIiIqLj/d4iA==';

test('the average colour and aspect ratio match the reference decoder', () => {
  const bytes = thumbHashBytes(HASH);
  const average = thumbHashAverage(bytes);

  expect(average.r).toBeCloseTo(0.4524, 4);
  expect(average.g).toBeCloseTo(0.4683, 4);
  expect(average.b).toBeCloseTo(0.5079, 4);
  expect(average.a).toBe(1);
  expect(thumbHashAspectRatio(bytes)).toBe(1.75);
});

test('decodes to an image at most 32 pixels a side, in the hash aspect', () => {
  const { w, h, rgba } = thumbHashToRgba(thumbHashBytes(HASH));

  expect([w, h]).toEqual([32, 18]);
  expect(rgba).toHaveLength(32 * 18 * 4);
});

test('the placeholder is a PNG the browser decodes, over the average colour', async () => {
  const placeholder = thumbHashPlaceholder(HASH);
  if (placeholder === 'skeleton' || placeholder.kind !== 'lqip')
    throw new Error('expected an lqip placeholder');

  expect(placeholder.color).toBe('rgb(115 119 130 / 1.00)');
  const img = new Image();
  img.src = placeholder.src;
  await img.decode();
  expect([img.naturalWidth, img.naturalHeight]).toEqual([32, 18]);
});
