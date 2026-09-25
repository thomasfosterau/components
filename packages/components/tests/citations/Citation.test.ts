import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import CitationMarker from '../../src/lib/citations/Citation.svelte';
import type { Citation } from '../../src/lib/citations/citation.ts';

const article: Citation = {
  id: '0190a8c0-1111-7000-8000-000000000001',
  kind: 'article',
  title: 'A revision of Rosa section Caninae',
};

test('renders its number and links to the reference-list anchor', async () => {
  const screen = await render(CitationMarker, { citation: article });
  const link = screen.getByRole('link');
  await expect.element(link).toHaveTextContent('[1]');
  await expect.element(link).toHaveAttribute('href', `#ref-${article.id}`);
  // The bare "[1]" is meaningless to a screen reader on its own.
  await expect.element(link).toHaveAccessibleName(`Reference 1: ${article.title}`);
});

test('renders parentheses and no superscript in the inline format', async () => {
  const screen = await render(CitationMarker, { citation: article, format: 'inline' });
  await expect.element(screen.getByRole('link')).toHaveTextContent('(1)');
});

test('renders no link when the page carries no reference list', async () => {
  const screen = await render(CitationMarker, { citation: article, linkToReference: false });
  await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
});

test('works with no bibliography provider mounted', async () => {
  // The fallback in `getBibliographyContext` is what makes this usable in a
  // story or a test at all — a throwing version would fail (reject) here.
  const screen = await render(CitationMarker, { citation: article });
  await expect.element(screen.getByRole('link')).toBeInTheDocument();
});

test('accepts a caller-supplied accessible reference label', async () => {
  const screen = await render(CitationMarker, {
    citation: article,
    referenceLabel: (n, title) => `Voir la référence ${n} : ${title}`,
  });
  await expect
    .element(screen.getByRole('link'))
    .toHaveAccessibleName(`Voir la référence 1 : ${article.title}`);
});
