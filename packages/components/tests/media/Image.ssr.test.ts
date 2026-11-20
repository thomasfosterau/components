/**
 * `Image` rendered on the server: the placeholder is in the markup and
 * nothing hides the image, so a page that never hydrates still shows it.
 */

import { render } from 'svelte/server';
import { expect, test } from 'vite-plus/test';
import Image from '../../src/lib/media/Image.svelte';
import { thumbHashPlaceholder } from '../../src/lib/media/thumbhash.ts';

test('a colour placeholder is server-rendered as the img background, with no fade', () => {
  const { body } = render(Image, {
    props: { src: '/photo.jpg', alt: 'A bed', placeholder: { kind: 'color', value: '#a3b18a' } },
  });

  expect(body).toContain('background-color: #a3b18a');
  expect(body).not.toContain('opacity-0');
});

test('a ThumbHash placeholder decodes on the server', () => {
  const { body } = render(Image, {
    props: {
      src: '/photo.jpg',
      alt: 'A bed',
      placeholder: thumbHashPlaceholder('nvcJdJqPdXlwiHiIiIqLj/d4iA=='),
    },
  });

  expect(body).toContain('background-image: url(&quot;data:image/png;base64,');
  expect(body).toContain('background-color: rgb(115 119 130 / 1.00)');
});
