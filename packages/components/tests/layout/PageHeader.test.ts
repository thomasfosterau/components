import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PageHeader from '../../src/lib/layout/PageHeader.svelte';
import PageHeaderFixture from './fixtures/PageHeaderFixture.svelte';
import { htmlSnippet } from './snippets.ts';

test('the title is the page heading', async () => {
  const screen = await render(PageHeaderFixture, {});

  await expect
    .element(screen.getByRole('heading', { level: 1, name: 'Tomato ‘Black Krim’' }))
    .toBeInTheDocument();
});

test('the heading level is a prop, not a consequence of the type scale', async () => {
  const screen = await render(PageHeaderFixture, { headingLevel: 2 });

  await expect
    .element(screen.getByRole('heading', { level: 2, name: 'Tomato ‘Black Krim’' }))
    .toBeInTheDocument();
});

test('renders a <header> that is not a banner when it sits inside <main>', async () => {
  const screen = await render(PageHeaderFixture, {});

  expect(screen.getByTestId('page-header').element().tagName).toBe('HEADER');
  // The banner is the site chrome, of which there is one per page.
  expect(screen.getByRole('banner').elements()).toHaveLength(0);
});

test('renders no optional region that was not given one', async () => {
  const screen = await render(PageHeaderFixture, {});

  for (const id of ['ph-eyebrow', 'ph-icon', 'ph-meta', 'ph-children']) {
    expect(screen.getByTestId(id).elements()).toHaveLength(0);
  }
  expect(screen.getByRole('group').elements()).toHaveLength(0);
});

test('renders every region when given one', async () => {
  const screen = await render(PageHeaderFixture, { full: true });

  for (const id of ['ph-eyebrow', 'ph-icon', 'ph-meta', 'ph-children']) {
    await expect.element(screen.getByTestId(id)).toBeInTheDocument();
  }
  await expect.element(screen.getByText('Solanum lycopersicum')).toBeInTheDocument();
});

test('the actions cluster is a named group, so it announces as one thing', async () => {
  const screen = await render(PageHeaderFixture, { full: true, actionsLabel: 'Plant actions' });

  const group = screen.getByRole('group', { name: 'Plant actions' });
  await expect.element(group).toBeInTheDocument();
  expect(group.element().querySelectorAll('button')).toHaveLength(2);
});

test('the decorative icon frame stays out of the accessibility tree', async () => {
  const screen = await render(PageHeaderFixture, { full: true });

  expect(screen.getByTestId('ph-icon').element().closest('[aria-hidden="true"]')).not.toBeNull();
});

test('a snippet title keeps its markup inside the heading', async () => {
  const screen = await render(PageHeader, {
    props: { title: htmlSnippet('<em>Rosa canina</em>') },
  });

  const heading = screen.getByRole('heading', { level: 1, name: 'Rosa canina' });
  await expect.element(heading).toBeInTheDocument();
  expect(heading.element().querySelector('em')).not.toBeNull();
});
