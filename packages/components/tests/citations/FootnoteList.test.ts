import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './fixtures/FootnoteListHarness.svelte';

test('renders nothing when nothing has been noted', async () => {
  const screen = await render(Harness, { footnotes: [] });
  await expect.element(screen.getByRole('heading')).not.toBeInTheDocument();
});

test('renders every note, numbered in registration order, with a custom symbol kept', async () => {
  const screen = await render(Harness, {
    footnotes: [
      ['a', { content: 'First note.' }],
      ['b', { content: 'Second note.', symbol: '†' }],
    ],
  });
  await expect.element(screen.getByText('1.')).toBeInTheDocument();
  await expect.element(screen.getByText('†.')).toBeInTheDocument();
  await expect.element(screen.getByText('First note.')).toBeInTheDocument();
});

test('defaults to a level-2 "Notes" heading', async () => {
  const screen = await render(Harness, { footnotes: [['a', { content: 'First note.' }]] });
  await expect
    .element(screen.getByRole('heading', { level: 2, name: 'Notes' }))
    .toBeInTheDocument();
});

test('accepts a custom title and heading level', async () => {
  const screen = await render(Harness, {
    footnotes: [['a', { content: 'First note.' }]],
    title: 'Endnotes',
    headingLevel: 3,
  });
  await expect
    .element(screen.getByRole('heading', { level: 3, name: 'Endnotes' }))
    .toBeInTheDocument();
});
