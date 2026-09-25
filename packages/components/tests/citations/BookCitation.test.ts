import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import BookCitation from '../../src/lib/citations/BookCitation.svelte';

const person = (name: string) => ({
  name,
  href: `/people/${name.toLowerCase().replace(/\W+/g, '-')}`,
  itemtype: 'Person' as const,
});

test('renders the title inside a <cite itemprop=name>', async () => {
  const screen = await render(BookCitation, { book: { title: 'The Great Gatsby' } });
  const cite = screen.container.querySelector('cite');
  expect(cite).toHaveTextContent('The Great Gatsby');
  expect(cite).toHaveAttribute('itemprop', 'name');
});

test("falls back to 'Untitled book', and the label is a prop", async () => {
  const screen = await render(BookCitation, { book: {} });
  await expect.element(screen.getByText('Untitled book')).toBeInTheDocument();
  const other = await render(BookCitation, { book: {}, untitledLabel: 'Libro sin título' });
  await expect.element(other.getByText('Libro sin título')).toBeInTheDocument();
});

test('renders the publication year as a <time>, or "no date"', async () => {
  const dated = await render(BookCitation, {
    book: { datePublished: new Date('1925-04-10T00:00:00Z') },
  });
  expect(dated.container.querySelector("time[itemprop='datePublished']")).toHaveTextContent('1925');
  const undated = await render(BookCitation, { book: {} });
  expect(undated.container.textContent).toContain('(no date)');
});

test('renders the edition before the year', async () => {
  const screen = await render(BookCitation, { book: { datePublished: 2000, edition: '3rd' } });
  expect(screen.container.textContent?.replace(/\s+/g, ' ')).toContain('(3rd edition: 2000)');
});

test('renders the page count, a URL link and an ISBN link', async () => {
  const screen = await render(BookCitation, {
    book: { numberOfPages: 342, url: 'https://example.com/book', isbn: '9780743273565' },
  });
  expect(screen.container.querySelector("[itemprop='numberOfPages']")).toHaveTextContent('342');
  await expect
    .element(screen.getByRole('link', { name: 'https://example.com/book' }))
    .toHaveAttribute('href', 'https://example.com/book');
  await expect
    .element(screen.getByRole('link', { name: /9780743273565/ }))
    .toHaveAttribute('href', expect.stringContaining('9780743273565'));
});

test('renders resolved authors, editors, translators, publisher and series', async () => {
  const screen = await render(BookCitation, {
    book: {
      title: 'The Left Hand of Darkness',
      authors: [person('Ursula K. Le Guin')],
      editors: [person('The Editor')],
      translators: [person('The Translator')],
      publisher: { name: 'Ace Books' },
      series: { name: 'Hainish Cycle' },
    },
  });
  await expect
    .element(screen.getByRole('link', { name: 'Ursula K. Le Guin' }))
    .toHaveAttribute('itemprop', 'name');
  await expect.element(screen.getByRole('link', { name: 'The Editor' })).toBeInTheDocument();
  await expect.element(screen.getByRole('link', { name: 'The Translator' })).toBeInTheDocument();
  expect(screen.container.textContent).toContain('(ed)');
  expect(screen.container.textContent).toContain('trans.');
  expect(
    screen.container.querySelector("[itemprop='publisher'] [itemprop='name']"),
  ).toHaveTextContent('Ace Books');
  const series = screen.container.querySelector("[itemprop='isPartOf']");
  expect(series).toHaveAttribute('itemtype', 'https://schema.org/BookSeries');
  expect(series).toHaveTextContent('Hainish Cycle');
});

test('renders authors in the order given — credit order is meaning', async () => {
  const screen = await render(BookCitation, {
    book: { authors: [person('First Author'), person('Second Author')] },
  });
  const names = Array.from(
    screen.container.querySelectorAll("[itemprop='author'] [itemprop='name']"),
    (n) => n.textContent,
  );
  expect(names).toEqual(['First Author', 'Second Author']);
});

test("omits every arm's chrome when nothing was resolved", async () => {
  const screen = await render(BookCitation, { book: { title: 'Bare Book' } });
  for (const prop of ['author', 'editor', 'translator', 'publisher', 'isPartOf']) {
    expect(screen.container.querySelector(`[itemprop='${prop}']`)).toBeNull();
  }
  expect(screen.container.textContent).not.toContain('(ed)');
  expect(screen.container.textContent).not.toContain('trans.');
});
