import { expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import KanbanBoardFixture from './fixtures/KanbanBoardFixture.svelte';

type OnMove = (
  cardId: string,
  toColumn: string,
  toIndex: number,
  signal: AbortSignal,
) => Promise<void>;

const announced = (): string =>
  document.querySelector('[aria-live="polite"]')?.textContent?.trim() ?? '';

const board = (): string => document.querySelector('[data-testid="columns"]')?.textContent ?? '';

const at = (x: number, y: number): PointerEventInit => ({
  bubbles: true,
  pointerId: 1,
  button: 0,
  clientX: x,
  clientY: y,
});

const focus = (element: Element): void => {
  if (element instanceof HTMLElement) element.focus();
};

test('the board is a named region of columns headed by title and card count', async () => {
  const screen = await render(KanbanBoardFixture);

  const region = screen.getByRole('region', { name: 'Board' });
  await expect.element(region).toBeInTheDocument();
  await expect
    .element(region.getByRole('heading', { level: 2, name: 'Planned, 3 cards' }))
    .toBeInTheDocument();
  await expect
    .element(region.getByRole('heading', { level: 2, name: 'Sown, 1 of 1 cards' }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole('button', { name: 'Move Tomato', exact: true }))
    .toHaveAccessibleDescription(/Press Space to pick up/);
});

test('Space, ArrowRight, Space moves a card to the next column and keeps focus on it', async () => {
  const onMove = vi.fn<OnMove>(async () => undefined);
  const screen = await render(KanbanBoardFixture, { onMove });
  const handle = screen.getByRole('button', { name: 'Move Tomato', exact: true });

  focus(handle.element());
  await userEvent.keyboard(' ');
  await expect.poll(announced).toBe('Picked up Tomato in Planned. Position 1 of 3.');
  await userEvent.keyboard('{ArrowRight}');
  await expect.poll(announced).toBe('Tomato moved to Sown, position 1 of 2.');
  await expect.element(handle).toHaveFocus();
  await userEvent.keyboard(' ');

  expect(onMove).toHaveBeenCalledExactlyOnceWith('tomato', 'sown', 0, expect.any(AbortSignal));
  await expect.poll(board).toBe('planned: Basil Carrot | sown: Tomato Pea | harvested: ');
  await expect.poll(announced).toBe('Tomato dropped in Sown, position 1 of 2.');
  await expect.element(handle).toHaveFocus();
});

test('Escape puts a held card back', async () => {
  const onMove = vi.fn<OnMove>(async () => undefined);
  const screen = await render(KanbanBoardFixture, { onMove });

  focus(screen.getByRole('button', { name: 'Move Basil', exact: true }).element());
  await userEvent.keyboard(' {ArrowRight}{ArrowRight}{Escape}');

  expect(onMove).not.toHaveBeenCalled();
  expect(board()).toBe('planned: Tomato Basil Carrot | sown: Pea | harvested: ');
  await expect.poll(announced).toBe('Move cancelled. Basil returned to Planned, position 2.');
});

test('the Move to menu moves a card without any drag', async () => {
  const onMove = vi.fn<OnMove>(async () => undefined);
  const screen = await render(KanbanBoardFixture, { onMove });

  await screen.getByRole('button', { name: 'Move Carrot to…' }).click();
  await page.getByRole('menuitemradio', { name: 'Harvested' }).click();

  expect(onMove).toHaveBeenCalledExactlyOnceWith('carrot', 'harvested', 0, expect.any(AbortSignal));
  await expect.poll(board).toBe('planned: Tomato Basil | sown: Pea | harvested: Carrot');
  await expect.poll(announced).toBe('Carrot moved to Harvested, position 1 of 1.');
});

test('a rejected move is rolled back and announced', async () => {
  const onMove = vi.fn<OnMove>(async () => {
    throw new Error('offline');
  });
  const screen = await render(KanbanBoardFixture, { onMove });

  await screen.getByRole('button', { name: 'Move Carrot to…' }).click();
  await page.getByRole('menuitemradio', { name: 'Harvested' }).click();

  await expect.poll(board).toBe('planned: Tomato Basil Carrot | sown: Pea | harvested: ');
  await expect.poll(announced).toBe('Could not move Carrot. It is back in Planned, position 3.');
});

test('with limits enforced, a full column refuses the card and the keyboard steps past it', async () => {
  const onMove = vi.fn<OnMove>(async () => undefined);
  const screen = await render(KanbanBoardFixture, { onMove, enforceLimits: true });
  const handle = screen.getByRole('button', { name: 'Move Basil', exact: true }).element();
  const pea = screen.getByText('Pea', { exact: true }).element().getBoundingClientRect();
  const start = handle.getBoundingClientRect();

  handle.dispatchEvent(new PointerEvent('pointerdown', at(start.left + 4, start.top + 4)));
  handle.dispatchEvent(new PointerEvent('pointermove', at(pea.left + 4, pea.bottom + 20)));
  await expect.poll(announced).toBe('Sown is full: it holds at most 1 cards.');
  document.body.dispatchEvent(new PointerEvent('pointerup', at(pea.left + 4, pea.bottom + 20)));
  expect(onMove).not.toHaveBeenCalled();
  expect(board()).toBe('planned: Tomato Basil Carrot | sown: Pea | harvested: ');

  focus(screen.getByRole('button', { name: 'Move Tomato', exact: true }).element());
  await userEvent.keyboard(' {ArrowRight}');
  await expect.poll(announced).toBe('Tomato moved to Harvested, position 1 of 1.');
  await userEvent.keyboard('{Escape}');

  await screen.getByRole('button', { name: 'Move Carrot to…' }).click();
  await expect
    .element(page.getByRole('menuitemradio', { name: 'Sown' }))
    .toHaveAttribute('aria-disabled', 'true');
});

test('dragging a handle moves the card between columns', async () => {
  const onMove = vi.fn<OnMove>(async () => undefined);
  const screen = await render(KanbanBoardFixture, { onMove });
  const handle = screen.getByRole('button', { name: 'Move Basil', exact: true }).element();
  const pea = screen.getByText('Pea', { exact: true }).element().getBoundingClientRect();
  const start = handle.getBoundingClientRect();

  handle.dispatchEvent(new PointerEvent('pointerdown', at(start.left + 4, start.top + 4)));
  handle.dispatchEvent(new PointerEvent('pointermove', at(pea.left + 4, pea.bottom + 20)));
  await expect.poll(announced).toBe('Basil moved to Sown, position 2 of 2.');
  // The handle's row was re-created in the new column, so the release lands on the page.
  document.body.dispatchEvent(new PointerEvent('pointerup', at(pea.left + 4, pea.bottom + 20)));

  expect(onMove).toHaveBeenCalledExactlyOnceWith('basil', 'sown', 1, expect.any(AbortSignal));
  await expect.poll(board).toBe('planned: Tomato Carrot | sown: Pea Basil | harvested: ');
});
