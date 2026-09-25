import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ChapterCitation from '../../src/lib/citations/ChapterCitation.svelte';

const person = (name: string) => ({ name, href: '/people/x', itemtype: 'Person' as const });
const text = (container: HTMLElement): string => container.textContent?.replace(/\s+/g, ' ') ?? '';

test("falls back to 'Untitled chapter'", async () => {
  const screen = await render(ChapterCitation, { chapter: {} });
  await expect.element(screen.getByText('Untitled chapter')).toBeInTheDocument();
});

test('renders the title quoted, with Chapter microdata', async () => {
  const screen = await render(ChapterCitation, { chapter: { title: 'On Liberty' } });
  expect(text(screen.container)).toContain("'On Liberty'");
  expect(screen.container.querySelector("[itemtype='https://schema.org/Chapter']")).not.toBeNull();
});

test('renders the chapter number and a page range', async () => {
  const screen = await render(ChapterCitation, {
    chapter: { chapterNumber: 4, pageStart: 101, pageEnd: 130 },
  });
  expect(text(screen.container)).toContain('ch 4');
  expect(text(screen.container)).toContain('(pp 101–130)');
});

test('renders a single start page', async () => {
  const screen = await render(ChapterCitation, { chapter: { pageStart: 55 } });
  expect(text(screen.container)).toContain('(p 55)');
});

test("renders the chapter's authors", async () => {
  const screen = await render(ChapterCitation, {
    chapter: { title: 'On Liberty', authors: [person('Chapter Author')] },
  });
  await expect.element(screen.getByRole('link', { name: 'Chapter Author' })).toBeInTheDocument();
  expect(screen.container.querySelector("[itemprop='author']")).not.toBeNull();
});

test('nests the containing book under isPartOf when it is resolved', async () => {
  const screen = await render(ChapterCitation, {
    chapter: {
      title: 'A Chapter',
      authors: [person('Chapter Author')],
      book: { title: 'The Containing Book', authors: [person('Book Author')] },
    },
  });
  const parent = screen.container.querySelector("[itemprop='isPartOf']");
  expect(parent).toHaveAttribute('itemtype', 'https://schema.org/Book');
  expect(parent).toHaveTextContent('The Containing Book');
  expect(parent).toHaveTextContent('Book Author');
  expect(text(screen.container)).toContain(' in ');
});

test('renders no isPartOf when the book was not resolved', async () => {
  const screen = await render(ChapterCitation, { chapter: { title: 'Standalone' } });
  expect(screen.container.querySelector("[itemprop='isPartOf']")).toBeNull();
});
