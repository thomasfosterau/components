import { page, userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Tabs from '../../src/lib/layout/Tabs.svelte';
import TabsFixture from './fixtures/TabsFixture.svelte';
import OverflowRowsFixture from './fixtures/OverflowRowsFixture.svelte';
import TabsScrollFixture from './fixtures/TabsScrollFixture.svelte';
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

test('links overflow: tabs that do not fit are links in a More menu, and the current tab stays', async () => {
  await render(OverflowRowsFixture);

  const nav = page.getByRole('navigation', { name: 'Sections' });
  const more = nav.getByRole('button', { name: 'More' });
  await expect.element(more).toBeVisible();
  await expect
    .element(nav.getByRole('link', { name: 'Section number 7' }))
    .toHaveAttribute('aria-current', 'page');

  await more.click();
  const menu = page.getByRole('menu', { name: 'More' });
  const entries = menu.getByRole('menuitem').elements();
  expect(entries.length).toBeGreaterThan(0);
  expect(
    entries.every(
      (entry) => entry.tagName === 'A' && entry.getAttribute('href')?.startsWith('/sections/'),
    ),
  ).toBe(true);
  expect(entries.map((entry) => entry.textContent?.trim())).not.toContain('Section number 7');
});

test('panels mode ignores overflow and keeps the tablist', async () => {
  const screen = await render(Tabs, { items, overflow: true, label: 'Results views' });

  await expect.element(screen.getByRole('tablist', { name: 'Results views' })).toBeInTheDocument();
  expect(document.querySelector('[aria-haspopup="menu"]')).toBeNull();
});

const scroller = (): Element => page.getByRole('tablist', { name: 'Sections' }).element();

test('scroll buttons: none while every tab fits', async () => {
  const screen = await render(TabsScrollFixture, { width: 2000, count: 3 });

  await expect.element(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument();
  expect(screen.getByRole('button').elements()).toHaveLength(0);
});

test('scroll buttons: outside the tablist and out of the Tab order, disabled at either end', async () => {
  const screen = await render(TabsScrollFixture, { width: 320 });

  const left = screen.getByRole('button', { name: 'Scroll tabs left' });
  const right = screen.getByRole('button', { name: 'Scroll tabs right' });
  await expect.element(right).toBeEnabled();
  await expect.element(left).toBeDisabled();
  expect(left.element().getAttribute('tabindex')).toBe('-1');
  expect(right.element().getAttribute('tabindex')).toBe('-1');
  expect(scroller().contains(left.element())).toBe(false);
  expect(scroller().contains(right.element())).toBe(false);
  expect(screen.getByRole('tab').elements()).toHaveLength(8);
  expect([...scroller().children].every((child) => child.getAttribute('role') === 'tab')).toBe(
    true,
  );

  await right.click();
  await expect.poll(() => scroller().scrollLeft).toBeGreaterThan(0);
  await expect.element(left).toBeEnabled();

  const list = scroller();
  list.scrollLeft = list.scrollWidth;
  await expect.element(right).toBeDisabled();

  await left.click();
  await expect.poll(() => scroller().scrollLeft).toBeLessThan(list.scrollWidth - list.clientWidth);
});

test('scroll buttons: arrowing to a far tab scrolls it into view', async () => {
  const screen = await render(TabsScrollFixture, { width: 320 });

  screen.getByRole('tab', { name: 'Section number 1' }).element().focus();
  await userEvent.keyboard('{End}');

  const last = screen.getByRole('tab', { name: 'Section number 8' });
  await expect.element(last).toHaveFocus();
  await expect.element(last).toHaveAttribute('aria-selected', 'true');
  await expect
    .poll(() => {
      const bounds = scroller().getBoundingClientRect();
      const box = last.element().getBoundingClientRect();
      return box.left >= bounds.left - 1 && box.right <= bounds.right + 1;
    })
    .toBe(true);
  await expect.element(screen.getByRole('button', { name: 'Scroll tabs right' })).toBeDisabled();
});

test('scroll buttons: under RTL the left button scrolls left, toward the later tabs', async () => {
  const screen = await render(TabsScrollFixture, { width: 320, dir: 'rtl' });

  const left = screen.getByRole('button', { name: 'Scroll tabs left' });
  const right = screen.getByRole('button', { name: 'Scroll tabs right' });
  await expect.element(right).toBeDisabled();
  await expect.element(left).toBeEnabled();
  expect(left.element().getBoundingClientRect().left).toBeLessThan(
    scroller().getBoundingClientRect().left,
  );

  await left.click();
  await expect.poll(() => scroller().scrollLeft).toBeLessThan(0);
  await expect.element(right).toBeEnabled();
});
