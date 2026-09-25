import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Card from '../../src/lib/ui/Card.svelte';
import { htmlSnippet, textSnippet } from './snippets.ts';

test('a bare card is the surface the apps wrote out by hand', async () => {
  const screen = await render(Card, { children: textSnippet('Body'), 'data-testid': 'card' });

  const card = screen.getByTestId('card');
  await expect.element(card).toHaveClass('card');
  await expect.element(card).toHaveClass('card-border');
  await expect.element(card).toHaveClass('bg-base-100');
  await expect.element(card).toHaveClass('shadow-sm');
  await expect.element(card).toHaveClass('card-md');
});

test('title is a real heading at the level asked for', async () => {
  const screen = await render(Card, {
    title: 'Tomato ‘Black Krim’',
    headingLevel: 3,
    children: textSnippet('Body'),
  });

  await expect
    .element(screen.getByRole('heading', { level: 3, name: 'Tomato ‘Black Krim’' }))
    .toBeInTheDocument();
});

test('as picks the element that carries the semantics', async () => {
  const screen = await render(Card, {
    as: 'section',
    'aria-label': 'Recent activity',
    children: textSnippet('Body'),
  });

  await expect.element(screen.getByRole('region', { name: 'Recent activity' })).toBeInTheDocument();
});

test('figure and actions render around the body', async () => {
  const screen = await render(Card, {
    children: textSnippet('Body'),
    figure: htmlSnippet('<img src="/bed.jpg" alt="Bed 3 in June" />'),
    actions: htmlSnippet('<button type="button">Open</button>'),
  });

  await expect.element(screen.getByRole('img', { name: 'Bed 3 in June' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
});

test('padded=false drops the body padding and bodyClass is merged', async () => {
  const screen = await render(Card, {
    children: htmlSnippet('<p data-testid="body-text">Body</p>'),
    padded: false,
    bodyClass: 'gap-0',
  });

  const body = screen.getByTestId('body-text').element().parentElement;
  expect(body?.className).toContain('p-0');
  expect(body?.className).toContain('gap-0');
});
