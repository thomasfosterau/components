import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import IndicatorFixture from './fixtures/IndicatorFixture.svelte';

test('the element comes before its mark in the DOM', async () => {
  const screen = await render(IndicatorFixture);

  const button = screen.getByRole('button', { name: 'Notifications, 3 unread' }).element();
  const badge = screen.getByText('3').element();
  expect(button.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('placement defaults to top-end and maps to the daisyUI pair', async () => {
  const screen = await render(IndicatorFixture);
  const item = screen.container.querySelector('.indicator-item');
  expect(item?.classList.contains('indicator-top')).toBe(true);
  expect(item?.classList.contains('indicator-end')).toBe(true);

  const bottom = await render(IndicatorFixture, { placement: 'bottom-start' });
  const moved = bottom.container.querySelector('.indicator-item');
  expect(moved?.classList.contains('indicator-bottom')).toBe(true);
  expect(moved?.classList.contains('indicator-start')).toBe(true);
});

test('has no role of its own, spreads attributes and merges class', async () => {
  const screen = await render(IndicatorFixture);

  const root = screen.getByTestId('indicator');
  await expect.element(root).toHaveClass('indicator');
  await expect.element(root).toHaveClass('mine');
  await expect.element(root).not.toHaveAttribute('role');
});
