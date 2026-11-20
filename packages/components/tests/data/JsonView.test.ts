/**
 * `JsonView`: names that read naturally with the type spelled out, lazy
 * children, copying by key and by toolbar, a filter that expands and marks
 * matches, long strings, cycles and custom values.
 */

import { afterEach, expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import JsonViewFixture from './fixtures/JsonViewFixture.svelte';

const garden = {
  name: 'Allotment',
  count: 12,
  open: true,
  owner: null,
  beds: [{ name: 'Tomato' }, { name: 'Bean' }, { name: 'Tomato cherry' }],
  site: 'https://example.org/plots/4',
};

const stubClipboard = () => {
  const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  return writeText;
};

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
});

const status = (): string =>
  Array.from(document.querySelectorAll('[role="status"]'), (node) => node.textContent.trim())
    .filter((text) => text !== '')
    .join(' | ');

test('a named tree; names read key, value and type; depth 1 leaves nested nodes shut', async () => {
  const screen = await render(JsonViewFixture, { value: garden });

  await expect.element(screen.getByRole('tree', { name: 'Data' })).toBeInTheDocument();
  await expect
    .element(screen.getByRole('treeitem', { name: 'root, object, 6 keys' }))
    .toHaveAttribute('aria-expanded', 'true');
  await expect
    .element(screen.getByRole('treeitem', { name: 'count: 12, number' }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole('treeitem', { name: 'name: Allotment, string' }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole('treeitem', { name: 'open: true, boolean' }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole('treeitem', { name: 'owner: null, null' }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole('treeitem', { name: 'beds, array, 3 items' }))
    .toHaveAttribute('aria-expanded', 'false');
});

test('→ expands a node, and its children render only then', async () => {
  const screen = await render(JsonViewFixture, { value: garden });
  const beds = screen.getByRole('treeitem', { name: 'beds, array, 3 items' });
  expect(screen.getByRole('treeitem').elements()).toHaveLength(7);

  await userEvent.click(screen.getByRole('treeitem', { name: 'count: 12, number' }));
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
  await expect.element(beds).toHaveFocus();
  await userEvent.keyboard('{ArrowRight}');

  await expect.element(beds).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('treeitem').elements()).toHaveLength(10);
  await expect
    .element(screen.getByRole('treeitem', { name: '0, object, 1 key' }))
    .toBeInTheDocument();
});

test('Ctrl+C copies the focused value as JSON and announces it', async () => {
  const writeText = stubClipboard();
  const screen = await render(JsonViewFixture, { value: garden, expandDepth: 2 });

  await userEvent.click(screen.getByRole('treeitem', { name: '1, object, 1 key' }));
  await userEvent.keyboard('{Control>}c{/Control}');

  await expect.poll(() => writeText.mock.calls.length).toBe(1);
  expect(writeText).toHaveBeenCalledWith('{\n  "name": "Bean"\n}');
  await expect.poll(status).toBe('Copied');
});

test('Copy path copies the selected node’s JSONPath', async () => {
  const writeText = stubClipboard();
  const screen = await render(JsonViewFixture, { value: garden, expandDepth: 3 });

  await userEvent.click(screen.getByRole('treeitem', { name: 'name: Tomato cherry, string' }));
  await userEvent.click(screen.getByRole('button', { name: 'Copy path' }));

  await expect.poll(() => writeText.mock.lastCall?.[0]).toBe('$.beds[2].name');
});

test('the filter keeps matches and their ancestors, marks them and counts them', async () => {
  const screen = await render(JsonViewFixture, { value: garden });
  const filter = screen.getByRole('searchbox', { name: 'Filter' });
  const tree = screen.getByRole('tree', { name: 'Data' });

  await expect.element(filter).toHaveAttribute('aria-controls', tree.element().id);
  await userEvent.fill(filter, 'tomato');

  await expect.poll(status).toBe('2 matches');
  await expect
    .element(screen.getByRole('treeitem', { name: 'beds, array, 3 items' }))
    .toHaveAttribute('aria-expanded', 'true');
  await expect
    .element(screen.getByRole('treeitem', { name: 'name: Tomato cherry, string' }))
    .toBeInTheDocument();
  expect(screen.getByRole('treeitem', { name: /Bean/ }).elements()).toHaveLength(0);
  expect(screen.getByRole('treeitem', { name: /^count/ }).elements()).toHaveLength(0);
  expect(Array.from(document.querySelectorAll('mark'), (mark) => mark.textContent)).toEqual([
    'Tomato',
    'Tomato',
  ]);

  await userEvent.fill(filter, '');
  await expect.element(screen.getByRole('treeitem', { name: /^count/ })).toBeInTheDocument();
});

test('Expand all and Collapse all', async () => {
  const screen = await render(JsonViewFixture, { value: garden });

  await userEvent.click(screen.getByRole('button', { name: 'Expand all' }));
  await expect
    .element(screen.getByRole('treeitem', { name: 'name: Bean, string' }))
    .toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
  await expect
    .element(screen.getByRole('treeitem', { name: 'root, object, 6 keys' }))
    .toHaveAttribute('aria-expanded', 'false');
});

test('a long string is cut, and Enter shows all of it', async () => {
  const long = 'x'.repeat(5000);
  const screen = await render(JsonViewFixture, { value: { notes: long } });
  const item = screen.getByRole('treeitem', { name: /^notes:/ });

  await expect.element(item).toHaveAccessibleName(`notes: ${'x'.repeat(200)}… Show more, string`);
  await userEvent.click(item);
  await expect.element(item).toHaveAccessibleName(`notes: ${long}, string`);
  await userEvent.keyboard('{Enter}');
  await expect.element(item).toHaveAccessibleName(/Show more, string$/);
});

test('a cycle shows a marker instead of recursing', async () => {
  const loop: Record<string, unknown> = { name: 'loop' };
  loop.self = loop;
  const screen = await render(JsonViewFixture, { value: loop });

  await expect
    .element(screen.getByRole('treeitem', { name: 'self: [Circular], circular reference' }))
    .not.toHaveAttribute('aria-expanded');
});

test('hideRoot puts the keys at the top; renderValue draws values', async () => {
  const screen = await render(JsonViewFixture, {
    value: garden,
    hideRoot: true,
    withRenderer: true,
  });

  expect(screen.getByRole('treeitem', { name: /^root/ }).elements()).toHaveLength(0);
  await expect
    .element(screen.getByRole('treeitem', { name: 'count: 12, number' }))
    .toHaveAttribute('aria-level', '1');
  await expect.element(screen.getByTestId('url')).toHaveTextContent('https://example.org/plots/4');
});
