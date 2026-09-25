import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ScholarlyArticleCitation from '../../src/lib/citations/ScholarlyArticleCitation.svelte';

const text = (container: HTMLElement): string => container.textContent?.replace(/\s+/g, ' ') ?? '';

test('renders the title inside a <cite>, with ScholarlyArticle microdata', async () => {
  const screen = await render(ScholarlyArticleCitation, {
    article: { title: 'Dark Matter Detection' },
  });
  expect(screen.container.querySelector('cite')).toHaveTextContent('Dark Matter Detection');
  expect(
    screen.container.querySelector("[itemtype='https://schema.org/ScholarlyArticle']"),
  ).not.toBeNull();
});

test("falls back to 'Untitled article' and 'no date'", async () => {
  const screen = await render(ScholarlyArticleCitation, { article: {} });
  expect(text(screen.container)).toContain('Untitled article');
  expect(text(screen.container)).toContain('(no date)');
});

test('renders the year', async () => {
  const screen = await render(ScholarlyArticleCitation, { article: { datePublished: 2019 } });
  expect(screen.container.querySelector('time')).toHaveTextContent('2019');
});

test('renders authors', async () => {
  const screen = await render(ScholarlyArticleCitation, {
    article: { authors: [{ name: 'A. Researcher', itemtype: 'Person' }] },
  });
  await expect.element(screen.getByText('A. Researcher')).toBeInTheDocument();
});

test('renders periodical, volume and issue as the nested isPartOf chain', async () => {
  const screen = await render(ScholarlyArticleCitation, {
    article: { periodical: { title: 'Nature' }, volumeNumber: 12, issueNumber: 3 },
  });
  const { container } = screen;
  expect(
    container.querySelector("[itemtype='https://schema.org/Periodical'] [itemprop='name']"),
  ).toHaveTextContent('Nature');
  expect(container.querySelector("[itemprop='volumeNumber']")).toHaveTextContent('12');
  expect(container.querySelector("[itemprop='issueNumber']")).toHaveTextContent('3');
  expect(
    container.querySelector("[itemtype='https://schema.org/PublicationIssue']"),
  ).not.toBeNull();
});

test('omits the issue chain entirely when there is no periodical, volume or issue', async () => {
  const screen = await render(ScholarlyArticleCitation, { article: { title: 'T' } });
  expect(screen.container.querySelector("[itemprop='isPartOf']")).toBeNull();
});

test('renders a page range', async () => {
  const screen = await render(ScholarlyArticleCitation, {
    article: { pageStart: 45, pageEnd: 67 },
  });
  expect(text(screen.container)).toContain('pp 45–67');
});

test('renders DOI, ISSN and URL links', async () => {
  const screen = await render(ScholarlyArticleCitation, {
    article: {
      doi: '10.1000/xyz123',
      periodical: { issn: '0028-0836' },
      url: 'https://example.org/a',
    },
  });
  await expect
    .element(screen.getByRole('link', { name: /10\.1000\/xyz123/ }))
    .toHaveAttribute('href', 'https://doi.org/10.1000/xyz123');
  await expect.element(screen.getByRole('link', { name: /0028-0836/ })).toBeInTheDocument();
  await expect
    .element(screen.getByRole('link', { name: 'https://example.org/a' }))
    .toBeInTheDocument();
});
