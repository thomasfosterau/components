import { page, userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import OverflowFixture from './fixtures/OverflowFixture.svelte';

const visibleLinks = (): string[] =>
  page
    .getByRole('list', { name: 'Sections' })
    .getByRole('link')
    .elements()
    .map((link) => link.textContent ?? '');

test('shows what fits, and the More menu holds the rest, in order, each once', async () => {
  await render(OverflowFixture, { width: 300 });

  const more = page.getByRole('button', { name: 'More' });
  await expect.element(more).toBeVisible();
  expect(visibleLinks().length).toBeLessThan(8);
  const shown = visibleLinks();

  await more.click();
  const menu = page.getByRole('menu', { name: 'More' });
  await expect.element(menu).toBeVisible();
  const inMenu = menu
    .getByRole('menuitem')
    .elements()
    .map((item) => item.textContent?.trim() ?? '');
  expect([...shown, ...inMenu]).toEqual(Array.from({ length: 8 }, (_, i) => `Item ${i + 1}`));
  expect(
    menu
      .getByRole('menuitem', { name: `Item ${shown.length + 1}` })
      .element()
      .getAttribute('href'),
  ).toBe(`/items/${shown.length + 1}`);
  await userEvent.keyboard('{Escape}');
  await expect.element(more).toHaveFocus();
});

test('grows to show everything, then collapses again', async () => {
  const screen = await render(OverflowFixture, { width: 300 });
  await expect.element(page.getByRole('button', { name: 'More' })).toBeVisible();

  await screen.rerender({ width: 800 });
  await expect.element(page.getByRole('button', { name: 'More' })).not.toBeInTheDocument();
  await expect.poll(visibleLinks).toHaveLength(8);

  await screen.rerender({ width: 300 });
  await expect.element(page.getByRole('button', { name: 'More' })).toBeVisible();
});

test('a current item stays visible however narrow the row', async () => {
  const items = Array.from({ length: 8 }, (_, i) => ({
    id: `item-${i + 1}`,
    label: `Item ${i + 1}`,
    href: `/items/${i + 1}`,
    current: i === 6,
  }));
  await render(OverflowFixture, { width: 120, items });

  await expect.element(page.getByRole('button', { name: 'More' })).toBeVisible();
  await expect.poll(visibleLinks).toContain('Item 7');
});

test('middle collapse keeps the first and last items, hiding from the centre out', async () => {
  await render(OverflowFixture, { width: 300, collapseFrom: 'middle' });

  await expect.element(page.getByRole('button', { name: 'More' })).toBeVisible();
  await expect.poll(visibleLinks).toEqual(['Item 1', 'Item 7', 'Item 8']);
});

test('a row that fits renders no trigger and marks itself ready', async () => {
  await render(OverflowFixture, { width: 800 });

  const list = page.getByRole('list', { name: 'Sections' });
  await expect.element(list).toHaveAttribute('data-overflow-ready', '');
  expect(document.querySelector('[aria-haspopup]')).toBeNull();
});
