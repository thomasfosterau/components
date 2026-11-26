/**
 * `ColorSwatchGroup` on the server, where there is no `CSS.supports`: a
 * value that could end the declaration still never reaches a `style`.
 */

import { render } from 'svelte/server';
import { expect, test } from 'vite-plus/test';
import ColorSwatchGroup from '../../src/lib/fields/ColorSwatchGroup.svelte';

test('server-renders a colour as the fill, and drops a value that adds a declaration', () => {
  const { body } = render(ColorSwatchGroup, {
    props: {
      label: 'Label colour',
      swatches: [
        { value: '#3a7d44', label: 'Moss green' },
        { value: 'red; background-image: url(https://example.com/x)', label: 'Injected' },
      ],
    },
  });

  const styles = [...body.matchAll(/style="([^"]*)"/g)].map((match) => match[1]);
  expect(styles).toContain('background-color: #3a7d44; color: #ffffff;');
  expect(styles.some((style) => style?.includes('background-image'))).toBe(false);
});
