/**
 * `SegmentBar` — one `role="img"` whose `aria-label` spells out every segment.
 * That single label is the component's reason to exist, so the test pins the
 * exact text, and pins that the segments themselves stay out of the
 * accessibility tree.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import SegmentBar from '../../src/lib/feedback/SegmentBar.svelte';

const storage = [
  { label: 'Photos', fraction: 0.62, tone: 'primary' as const },
  { label: 'Video', fraction: 0.31, tone: 'secondary' as const },
  { label: 'Other', fraction: 0.07 },
];

test('the whole bar is one labelled image, spelling out every segment', async () => {
  const screen = await render(SegmentBar, {
    label: 'Storage',
    segments: storage,
    locales: 'en-AU',
  });

  await expect
    .element(screen.getByRole('img'))
    .toHaveAccessibleName('Storage: Photos 62%, Video 31%, Other 7%');
});

test('the segments are hidden and sized by their fraction', async () => {
  const screen = await render(SegmentBar, { label: 'Storage', segments: storage });

  const bar = screen.getByRole('img').element();
  const segments = [...bar.children] as HTMLElement[];
  expect(segments).toHaveLength(3);
  for (const segment of segments) expect(segment).toHaveAttribute('aria-hidden', 'true');
  // Svelte writes the inline style through the CSSOM, which normalises the
  // component's `62.00%` to `62%`.
  expect(segments[0]?.style.width).toBe('62%');
  expect(segments[2]?.style.width).toBe('7%');
});

test('a fraction outside [0, 1] is clamped, in the label and in the width', async () => {
  const screen = await render(SegmentBar, {
    label: 'Beds surveyed',
    segments: [{ label: 'Surveyed', fraction: 1.4 }],
    locales: 'en-AU',
  });

  const bar = screen.getByRole('img');
  await expect.element(bar).toHaveAccessibleName('Beds surveyed: Surveyed 100%');
  expect((bar.element().children[0] as HTMLElement | undefined)?.style.width).toBe('100%');
});

test('a colourToken binds the segment’s custom property, never a colour value', async () => {
  const screen = await render(SegmentBar, {
    label: 'Records by rank',
    segments: [{ label: 'Genus', fraction: 0.5, colourToken: '--rank-genus' }],
  });

  const segment = screen.getByRole('img').element().children[0] as HTMLElement;
  expect(segment.getAttribute('style')).toContain('--segment-colour: var(--rank-genus');
  expect(segment.className).toContain('bg-(--segment-colour)');
});

test('a token that is not a custom-property name is dropped', async () => {
  const screen = await render(SegmentBar, {
    label: 'Records by rank',
    segments: [{ label: 'Genus', fraction: 0.5, colourToken: 'red; position: fixed' }],
  });

  const segment = screen.getByRole('img').element().children[0] as HTMLElement;
  expect(segment.getAttribute('style')).toContain('--segment-colour: var(--color-neutral');
  expect(segment.getAttribute('style')).not.toContain('position: fixed');
});

test('showValues prints a percentage in a segment wide enough for it', async () => {
  const screen = await render(SegmentBar, {
    label: 'Two-candidate preferred',
    segments: [
      { label: 'Nguyen', fraction: 0.541, tone: 'info' },
      { label: 'Smith', fraction: 0.459, tone: 'error' },
    ],
    showValues: true,
    marker: 0.5,
    locales: 'en-AU',
  });

  await expect.element(screen.getByText('54.1%')).toBeInTheDocument();
  // The marker is the last child, and decorative.
  const children = [...screen.getByRole('img').element().children] as HTMLElement[];
  expect(children).toHaveLength(3);
  expect(children[2]).toHaveAttribute('aria-hidden', 'true');
  expect(children[2]?.style.left).toBe('50%');
});
