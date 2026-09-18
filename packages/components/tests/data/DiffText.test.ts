/**
 * `DiffText` carries "added" and "removed" in `<ins>` and `<del>`, so the
 * information survives a reader who cannot see the colours and a copy of the
 * page into somewhere with no styling at all.
 */

import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DiffText from '../../src/lib/data/DiffText.svelte';
import type { DiffSegment } from '../../src/lib/data/diff.ts';

const segments: readonly DiffSegment[] = [
  { kind: 'equal', text: 'The' },
  { kind: 'delete', text: 'cat' },
  { kind: 'insert', text: 'dog' },
  { kind: 'equal', text: 'sat.' },
];

test('renders each run in the element that carries its meaning', async () => {
  await render(DiffText, { segments });

  expect(document.querySelector('del')?.textContent).toBe('cat');
  expect(document.querySelector('ins')?.textContent).toBe('dog');
  expect(document.querySelector('p')?.textContent).toBe('The cat dog sat.');
});

test('the separator sits between runs, so a character diff can drop it', async () => {
  await render(DiffText, { segments, separator: '' });

  expect(document.querySelector('p')?.textContent).toBe('Thecatdogsat.');
});

test('labels the runs for assistive technology when asked', async () => {
  const screen = await render(DiffText, {
    segments,
    insertLabel: 'inserted',
    deleteLabel: 'deleted',
  });

  await expect.element(screen.getByText('inserted')).toHaveClass('sr-only');
  expect(document.querySelector('ins')?.textContent).toBe('inserteddog');
});

test('says nothing extra by default', async () => {
  const screen = await render(DiffText, { segments });

  expect(screen.getByText('inserted').elements()).toHaveLength(0);
});
