import { userEvent, type Locator } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import FloatingPanelFixture from './fixtures/FloatingPanelFixture.svelte';

const focus = (locator: Locator): void => {
  const element = locator.element();
  if (element instanceof HTMLElement) {
    element.focus();
  }
};

const z = (element: Element) => Number(getComputedStyle(element).zIndex);

const rectOf = (screen: Awaited<ReturnType<typeof render>>) => screen.getByTestId('rect');

test('is a non-modal dialog named by its title, and the page behind stays usable', async () => {
  const screen = await render(FloatingPanelFixture);

  const dialog = screen.getByRole('dialog', { name: 'Layers' });
  await expect.element(dialog).toBeInTheDocument();
  await expect.element(dialog).not.toHaveAttribute('aria-modal');

  await userEvent.click(screen.getByRole('button', { name: /Behind/ }));
  await expect.element(screen.getByRole('button', { name: 'Behind (1)' })).toBeInTheDocument();
});

test('the title bar moves the panel with arrow keys and resizes it with Shift', async () => {
  const screen = await render(FloatingPanelFixture);

  const handle = screen.getByRole('button', { name: 'Layers' });
  await expect.element(handle).toHaveAttribute('aria-roledescription', 'draggable panel');
  await expect.element(handle).toHaveAccessibleDescription(/Use arrow keys to move/);

  focus(handle);
  await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
  await expect.element(rectOf(screen)).toHaveTextContent('130,100,200,150');

  await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
  await expect.element(rectOf(screen)).toHaveTextContent('130,100,200,160');

  await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');
  await expect.element(rectOf(screen)).toHaveTextContent('129,100,200,160');

  await expect
    .element(screen.getByRole('dialog').getByRole('status'))
    .toHaveTextContent('Moved to the centre');
});

test('keyboard moves stop at the boundary', async () => {
  const screen = await render(FloatingPanelFixture);

  focus(screen.getByRole('button', { name: 'Layers' }));
  await userEvent.keyboard('{End}');
  await expect.element(rectOf(screen)).toHaveTextContent('400,100,200,150');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(rectOf(screen)).toHaveTextContent('400,100,200,150');
  await userEvent.keyboard('{Home}');
  await expect.element(rectOf(screen)).toHaveTextContent('0,100,200,150');
});

test('minimise makes the content inert, and restore brings back the same rect', async () => {
  const screen = await render(FloatingPanelFixture);

  await userEvent.click(screen.getByRole('button', { name: 'Minimise' }));
  await expect.element(screen.getByTestId('stage')).toHaveTextContent('minimized');
  const roads = screen.getByRole('button', { name: 'Roads', includeHidden: true });
  expect(roads.element().closest('[inert]')).not.toBeNull();

  await userEvent.click(screen.getByRole('button', { name: 'Restore' }));
  await expect.element(screen.getByTestId('stage')).toHaveTextContent('default');
  expect(roads.element().closest('[inert]')).toBeNull();
  await expect.element(rectOf(screen)).toHaveTextContent('100,100,200,150');
});

test('maximise fills the boundary, and Enter on the title bar toggles it', async () => {
  const screen = await render(FloatingPanelFixture);
  const dialog = screen.getByRole('dialog', { name: 'Layers' });

  await userEvent.click(screen.getByRole('button', { name: 'Maximise' }));
  await expect
    .element(dialog)
    .toHaveStyle({ left: '0px', top: '0px', width: '600px', height: '400px' });

  focus(screen.getByRole('button', { name: 'Layers' }));
  await userEvent.keyboard('{Enter}');
  await expect.element(dialog).toHaveStyle({ left: '100px', width: '200px' });
});

test('dragging the title bar moves it, and a drop near a corner snaps to it', async () => {
  const screen = await render(FloatingPanelFixture);
  const handle = screen.getByRole('button', { name: 'Layers' }).element();
  const box = handle.getBoundingClientRect();
  const x = box.left + 10;
  const y = box.top + 5;
  const fire = (type: string, clientX: number, clientY: number) =>
    handle.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        button: 0,
        pointerId: 1,
        isPrimary: true,
        clientX,
        clientY,
      }),
    );

  fire('pointerdown', x, y);
  fire('pointermove', x + 50, y + 20);
  await expect.element(rectOf(screen)).toHaveTextContent('150,120,200,150');
  fire('pointermove', x + 290, y - 90);
  fire('pointerup', x + 290, y - 90);
  await expect.element(rectOf(screen)).toHaveTextContent('400,0,200,150');
});

test('clicking a panel behind brings it to the front', async () => {
  const screen = await render(FloatingPanelFixture, { second: true });
  const layers = screen.getByRole('dialog', { name: 'Layers' }).element();
  const legend = screen.getByRole('dialog', { name: 'Legend' }).element();

  expect(z(legend)).toBeGreaterThan(z(layers));
  await userEvent.click(screen.getByRole('button', { name: 'Roads' }));
  expect(z(layers)).toBeGreaterThan(z(legend));
});

test('F6 cycles focus from the page through each open panel and back', async () => {
  const screen = await render(FloatingPanelFixture, { second: true });
  const behind = screen.getByRole('button', { name: /Behind/ });

  focus(behind);
  await userEvent.keyboard('{F6}');
  await expect.element(screen.getByRole('button', { name: 'Roads' })).toHaveFocus();
  await userEvent.keyboard('{F6}');
  await expect.element(screen.getByRole('button', { name: 'Key' })).toHaveFocus();
  await userEvent.keyboard('{F6}');
  await expect.element(behind).toHaveFocus();
  await userEvent.keyboard('{Shift>}{F6}{/Shift}');
  await expect.element(screen.getByRole('button', { name: 'Key' })).toHaveFocus();
});

test('Escape returns focus to the page without closing', async () => {
  const screen = await render(FloatingPanelFixture);
  const behind = screen.getByRole('button', { name: /Behind/ });

  focus(behind);
  await userEvent.click(screen.getByRole('button', { name: 'Roads' }));
  await userEvent.keyboard('{Escape}');
  await expect.element(behind).toHaveFocus();
  await expect.element(screen.getByRole('dialog', { name: 'Layers' })).toBeInTheDocument();
});

test('opening moves focus in, and closing returns it to the opener', async () => {
  const screen = await render(FloatingPanelFixture, { initiallyOpen: false });
  const opener = screen.getByRole('button', { name: 'Show layers' });

  await userEvent.click(opener);
  await expect.element(screen.getByRole('button', { name: 'Roads' })).toHaveFocus();

  await userEvent.click(screen.getByRole('button', { name: 'Close' }));
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  await expect.element(opener).toHaveFocus();
});
