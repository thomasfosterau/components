import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Footer from '../../src/lib/layout/Footer.svelte';
import { htmlSnippet } from './snippets.ts';

const columns = htmlSnippet(
  '<nav aria-label="Browse" data-testid="footer-nav"><h2 class="footer-title">Browse</h2></nav>',
);

test('is the contentinfo landmark', async () => {
  const screen = await render(Footer, { children: columns });

  await expect.element(screen.getByRole('contentinfo')).toBeInTheDocument();
  await expect.element(screen.getByTestId('footer-nav')).toBeInTheDocument();
});

test('renders no aside when it was given none', async () => {
  const screen = await render(Footer, { children: columns });

  expect(screen.getByRole('contentinfo').element().firstElementChild?.tagName).toBe('NAV');
});

test('the attribution block renders before the columns', async () => {
  const screen = await render(Footer, {
    children: columns,
    aside: htmlSnippet('<p data-testid="footer-aside">Data under CC BY 4.0.</p>'),
  });

  const footer = screen.getByRole('contentinfo').element();
  expect(footer.firstElementChild?.tagName).toBe('ASIDE');
  await expect.element(screen.getByTestId('footer-aside')).toBeInTheDocument();
});
