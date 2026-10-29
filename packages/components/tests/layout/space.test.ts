/**
 * The `Fits` band logic picks exactly one layout per width. (That the
 * tables are literal is pinned by the class-string assertions in the
 * component tests.)
 */

import { expect, test } from 'vite-plus/test';
import { fitsLayoutClass } from '../../src/lib/layout/space.ts';

test('fitsLayoutClass bands three layouts between two breakpoints', () => {
  const bands = [0, 1, 2].map((index) => fitsLayoutClass(index, 3, ['48rem', '28rem']));
  expect(bands).toEqual([
    ['hidden', '@min-[48rem]:block'],
    ['hidden', '@min-[28rem]:block', '@min-[48rem]:hidden'],
    ['block', '@min-[28rem]:hidden'],
  ]);
});
