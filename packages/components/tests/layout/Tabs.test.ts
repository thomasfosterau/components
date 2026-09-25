import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Tabs from '../../src/lib/layout/Tabs.svelte';
import TabsFixture from './fixtures/TabsFixture.svelte';
import type { TabItem } from '../../src/lib/layout/types.ts';

const items: readonly TabItem[] = [
  { value: 'fp', label: 'First preferences', href: '/fp' },
  { value: 'tcp', label: 'Two-candidate preferred', href: '/tcp' },
  { value: 'booths', label: 'Polling places', href: '/booths' },
  { value: 'recount', label: 'Recount', href: '/recount', disabled: true },
];

test('panels: a named tab list whose first enabled tab is selected', async () => {
  const screen = await render(TabsFixture, { items });

  await expect.element(screen.getByRole('tablist', { name: 'Results views' })).toBeInTheDocument();
  expect(screen.getByRole('tab').elements()).toHaveLength(4);
  await expect
    .element(screen.getByRole('tab', { name: 'First preferences' }))
    .toHaveAttribute('aria-selected', 'true');
  await expect.element(screen.getByTestId('panel-fp')).toBeVisible();
});

test('panels: the selected tab points at the panel it controls', async () => {
  const screen = await render(TabsFixture, { items });

  const tab = screen.getByRole('tab', { name: 'First preferences' }).element();
  const panel = screen.getByRole('tabpanel').element();

  expect(tab.getAttribute('aria-controls')).toBe(panel.id);
  expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
});

test('panels: an initial value wins over the default selection', async () => {
  const screen = await render(TabsFixture, { items, initial: 'tcp' });

  await expect
    .element(screen.getByRole('tab', { name: 'Two-candidate preferred' }))
    .toHaveAttribute('aria-selected', 'true');
  await expect.element(screen.getByTestId('panel-tcp')).toBeVisible();
});

test('panels: clicking a tab selects it and writes the bound value', async () => {
  const screen = await render(TabsFixture, { items });

  await userEvent.click(screen.getByRole('tab', { name: 'Two-candidate preferred' }));

  await expect.element(screen.getByTestId('value')).toHaveTextContent('tcp');
  await expect.element(screen.getByTestId('panel-tcp')).toBeVisible();
  await expect.element(screen.getByTestId('panel-fp')).not.toBeVisible();
});

test('panels: the whole strip is one Tab stop, and the arrows move within it', async () => {
  const screen = await render(TabsFixture, { items });

  const first = screen.getByRole('tab', { name: 'First preferences' });
  const second = screen.getByRole('tab', { name: 'Two-candidate preferred' });
  const third = screen.getByRole('tab', { name: 'Polling places' });

  first.element().focus();
  await expect.element(first).toHaveFocus();

  await userEvent.keyboard('{ArrowRight}');
  await expect.element(second).toHaveFocus();
  await expect.element(second).toHaveAttribute('aria-selected', 'true');

  await userEvent.keyboard('{ArrowRight}');
  await expect.element(third).toHaveFocus();

  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(second).toHaveFocus();
  await expect.element(first).toHaveAttribute('aria-selected', 'false');
});

test('panels: Home and End jump to the ends of the strip', async () => {
  const screen = await render(TabsFixture, { items });

  const first = screen.getByRole('tab', { name: 'First preferences' });
  screen.getByRole('tab', { name: 'Polling places' }).element().focus();

  await userEvent.keyboard('{Home}');
  await expect.element(first).toHaveFocus();

  await userEvent.keyboard('{End}');
  // The disabled tab is not a stop, so End lands on the last enabled one.
  await expect.element(screen.getByRole('tab', { name: 'Polling places' })).toHaveFocus();
});

test('panels: a disabled tab reports itself disabled', async () => {
  const screen = await render(TabsFixture, { items });

  await expect.element(screen.getByRole('tab', { name: 'Recount' })).toBeDisabled();
});

test('panels: no panel snippet, no tabpanels', async () => {
  const screen = await render(TabsFixture, { items, withPanels: false });

  expect(screen.getByRole('tab').elements()).toHaveLength(4);
  expect(screen.getByRole('tabpanel').elements()).toHaveLength(0);
});

test('links: a named nav of anchors, never a tab widget', async () => {
  const screen = await render(TabsFixture, { items, mode: 'links', withPanels: false });

  await expect
    .element(screen.getByRole('navigation', { name: 'Results views' }))
    .toBeInTheDocument();
  expect(screen.getByRole('tablist').elements()).toHaveLength(0);
  expect(screen.getByRole('tab').elements()).toHaveLength(0);
  await expect
    .element(screen.getByRole('link', { name: 'First preferences' }))
    .toHaveAttribute('href', '/fp');
});

test('links: the current page comes from the context when no value is tracked', async () => {
  const screen = await render(TabsFixture, {
    items,
    mode: 'links',
    withPanels: false,
    currentHref: '/booths',
  });

  await expect
    .element(screen.getByRole('link', { name: 'Polling places' }))
    .toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'First preferences' }).element()).not.toHaveAttribute(
    'aria-current',
  );
});

test('links: a tracked value wins over the context', async () => {
  const screen = await render(TabsFixture, {
    items,
    mode: 'links',
    withPanels: false,
    initial: 'fp',
    currentHref: '/booths',
  });

  const current = screen.getByRole('link', { name: 'First preferences' });
  await expect.element(current).toHaveAttribute('aria-current', 'page');
  await expect.element(current).toHaveClass('tab-active');
  expect(screen.getByRole('link', { name: 'Polling places' }).element()).not.toHaveAttribute(
    'aria-current',
  );
});

test('links: a disabled item stays in the strip as inert text', async () => {
  const screen = await render(Tabs, { items, mode: 'links', label: 'Results views' });

  expect(screen.getByRole('link', { name: 'Recount' }).elements()).toHaveLength(0);
  await expect.element(screen.getByText('Recount')).toHaveAttribute('aria-disabled', 'true');
});

test('the variant and size classes come from the lookup tables', async () => {
  const screen = await render(Tabs, {
    items,
    mode: 'links',
    variant: 'lift',
    size: 'sm',
    label: 'Results views',
  });

  const nav = screen.getByRole('navigation', { name: 'Results views' });
  await expect.element(nav).toHaveClass('tabs-lift');
  await expect.element(nav).toHaveClass('tabs-sm');
});
