import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Harness from './fixtures/ReferenceListHarness.svelte';
import type { Citation } from '../../src/lib/citations/citation.ts';

const revision: Citation = {
  id: 'revision',
  kind: 'article',
  title: 'A revision of Rosa section Caninae',
  authors: ['Smith, J.'],
  year: 1998,
};
const flora: Citation = { id: 'flora', kind: 'book', title: 'Flora of New South Wales' };

test('renders nothing when nothing has been cited', async () => {
  const screen = await render(Harness, { citations: [] });
  await expect.element(screen.getByRole('heading')).not.toBeInTheDocument();
});

test('renders every cited source, numbered in citation order', async () => {
  const screen = await render(Harness, { citations: [revision, flora] });
  await expect.element(screen.getByText('[1]')).toBeInTheDocument();
  await expect.element(screen.getByText('[2]')).toBeInTheDocument();
  await expect.element(screen.getByText(/A revision of Rosa section Caninae/)).toBeInTheDocument();
});

test('defaults to a level-2 "References" heading', async () => {
  const screen = await render(Harness, { citations: [flora] });
  const heading = screen.getByRole('heading', { level: 2, name: 'References' });
  await expect.element(heading).toBeInTheDocument();
});

test('accepts a custom title and heading level', async () => {
  const screen = await render(Harness, {
    citations: [flora],
    title: 'Works cited',
    headingLevel: 3,
  });
  await expect
    .element(screen.getByRole('heading', { level: 3, name: 'Works cited' }))
    .toBeInTheDocument();
});

test('suppresses the heading when showTitle is false', async () => {
  const screen = await render(Harness, { citations: [flora], showTitle: false });
  await expect.element(screen.getByRole('heading')).not.toBeInTheDocument();
});
