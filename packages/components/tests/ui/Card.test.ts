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

test('shadow=false drops the shadow and keeps the rest of the surface', async () => {
  const screen = await render(Card, {
    children: textSnippet('Body'),
    shadow: false,
    'data-testid': 'card',
  });

  const card = screen.getByTestId('card');
  await expect.element(card).toHaveClass('card');
  await expect.element(card).toHaveClass('card-border');
  await expect.element(card).not.toHaveClass('shadow-sm');
});

test('as="form" is a real form, with the actions row inside it', async () => {
  const screen = await render(Card, {
    as: 'form',
    method: 'post',
    action: '/gardens/1?/rename',
    'aria-label': 'Rename garden',
    children: htmlSnippet('<input name="name" aria-label="Name" />'),
    actions: htmlSnippet('<button type="submit">Save</button>'),
  });

  const form = screen.getByRole('form', { name: 'Rename garden' });
  await expect.element(form).toHaveAttribute('method', 'post');
  await expect.element(form).toHaveAttribute('action', '/gardens/1?/rename');
  const save = screen.getByRole('button', { name: 'Save' }).element();
  expect(save.closest('form')).toBe(form.element());
});

test('as="li" is a list item, and as="dl" a description list', async () => {
  const screen = await render(Card, {
    as: 'li',
    'data-testid': 'item',
    children: textSnippet('Bed 3'),
  });
  expect(screen.getByTestId('item').element().tagName).toBe('LI');

  const list = await render(Card, {
    as: 'dl',
    'data-testid': 'facts',
    children: htmlSnippet('<div><dt>Sown</dt><dd>12 March</dd></div>'),
  });
  expect(list.getByTestId('facts').element().tagName).toBe('DL');
  await expect.element(list.getByRole('term')).toHaveTextContent('Sown');
});
