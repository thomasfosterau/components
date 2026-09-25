import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ReportCitation from '../../src/lib/citations/ReportCitation.svelte';

test('renders the title with itemprop=name, and Report microdata', async () => {
  const screen = await render(ReportCitation, { report: { title: 'State of the Environment' } });
  expect(screen.container.querySelector("cite[itemprop='name']")).toHaveTextContent(
    'State of the Environment',
  );
  expect(screen.container.querySelector("[itemtype='https://schema.org/Report']")).not.toBeNull();
});

test("falls back to 'Untitled report' and 'no date'", async () => {
  const screen = await render(ReportCitation, { report: {} });
  expect(screen.container.textContent).toContain('Untitled report');
  expect(screen.container.textContent).toContain('(no date)');
});

test('renders the year and the page count', async () => {
  const screen = await render(ReportCitation, {
    report: { datePublished: '2021-06-30', numberOfPages: 88 },
  });
  expect(screen.container.querySelector('time')).toHaveTextContent('2021');
  expect(screen.container.querySelector("[itemprop='numberOfPages']")).toHaveTextContent('88');
});

test('renders an Organization author and publisher — a report’s usual credit', async () => {
  const screen = await render(ReportCitation, {
    report: {
      authors: [{ name: 'Department of X', itemtype: 'Organization' }],
      publisher: { name: 'Department of X', address: { locality: 'Canberra' } },
    },
  });
  expect(screen.container.querySelector("[itemprop='author']")).toHaveAttribute(
    'itemtype',
    'https://schema.org/Organization',
  );
  expect(screen.container.querySelector("[itemprop='addressLocality']")).toHaveTextContent(
    'Canberra',
  );
});

test("omits each arm's chrome independently", async () => {
  const screen = await render(ReportCitation, { report: { title: 'T', editors: [{ name: 'E' }] } });
  expect(screen.container.querySelector("[itemprop='author']")).toBeNull();
  expect(screen.container.querySelector("[itemprop='editor']")).not.toBeNull();
  expect(screen.container.querySelector("[itemprop='translator']")).toBeNull();
  expect(screen.container.querySelector("[itemprop='publisher']")).toBeNull();
});
