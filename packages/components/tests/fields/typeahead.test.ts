import { expect, test } from 'vite-plus/test';
import { createTypeahead } from '../../src/lib/fields/typeahead.ts';

const labels = ['Apple', 'Apricot', 'Banana', 'Avocado'];
const all = (): boolean => true;

test('a repeated letter cycles through the matches after the current one', () => {
  let time = 0;
  const typeahead = createTypeahead(() => (time += 1000));
  expect(typeahead('a', labels, all, 0)).toBe(1);
  expect(typeahead('a', labels, all, 1)).toBe(3);
  expect(typeahead('a', labels, all, 3)).toBe(0);
});

test('letters typed quickly build one query, and disabled entries are skipped', () => {
  let time = 0;
  const typeahead = createTypeahead(() => (time += 100));
  expect(typeahead('a', labels, (index) => index !== 1, 0)).toBe(3);
  expect(typeahead('p', labels, all, 3)).toBe(0);
  expect(typeahead('x', labels, all, 0)).toBeUndefined();
});
