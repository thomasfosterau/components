/**
 * `Accordion` — APG accordion on bits-ui: real headings, `aria-expanded`
 * buttons controlling labelled regions, single / multiple / required, and
 * find-in-page-reachable closed panels.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import AccordionFixture from './fixtures/AccordionFixture.svelte';

test('every title is a native heading at headingLevel', async () => {
  const screen = await render(AccordionFixture, {});

  const headings = screen.getByRole('heading', { level: 3 });
  expect(headings.elements().map((heading) => heading.tagName)).toEqual(['H3', 'H3', 'H3']);
  expect(headings.elements().map((heading) => heading.textContent?.trim())).toEqual([
    'Spring',
    'Summer',
    'Autumn',
  ]);
  expect(headings.first().element().hasAttribute('role')).toBe(false);
});

test('headingLevel={2} changes every heading', async () => {
  const screen = await render(AccordionFixture, { headingLevel: 2 });

  expect(screen.getByRole('heading', { level: 2 }).elements()).toHaveLength(3);
});

test('a button expands its panel, a region named by the button', async () => {
  const screen = await render(AccordionFixture, {});

  const spring = screen.getByRole('button', { name: 'Spring', exact: true });
  await expect.element(spring).toHaveAttribute('aria-expanded', 'false');
  await spring.click();
  await expect.element(spring).toHaveAttribute('aria-expanded', 'true');
  const region = screen.getByRole('region', { name: 'Spring' });
  await expect.element(region).toBeVisible();
  await expect.element(region).toHaveTextContent('Sow broad beans.');
  expect(spring.element().getAttribute('aria-controls')).toBe(region.element().id);
});

test('type="single": opening one closes the other, and value binds', async () => {
  const screen = await render(AccordionFixture, {});

  await screen.getByRole('button', { name: 'Spring', exact: true }).click();
  await screen.getByRole('button', { name: 'Summer', exact: true }).click();
  await expect
    .element(screen.getByRole('button', { name: 'Spring', exact: true }))
    .toHaveAttribute('aria-expanded', 'false');
  await expect.element(screen.getByTestId('value')).toHaveTextContent('summer');
});

test('required: the open item will not close, and says so', async () => {
  const screen = await render(AccordionFixture, { required: true, initial: 'spring' });

  const spring = screen.getByRole('button', { name: 'Spring', exact: true });
  await expect.element(spring).toHaveAttribute('aria-expanded', 'true');
  await expect.element(spring).toHaveAttribute('aria-disabled', 'true');
  // Playwright refuses to click an aria-disabled element; a reader's
  // activation still reaches it, so dispatch the click directly.
  (spring.element() as HTMLButtonElement).click();
  await expect.element(spring).toHaveAttribute('aria-expanded', 'true');
  await expect.element(screen.getByTestId('value')).toHaveTextContent('spring');
});

test('type="multiple": two open at once', async () => {
  const screen = await render(AccordionFixture, { type: 'multiple' });

  await screen.getByRole('button', { name: 'Spring', exact: true }).click();
  await screen.getByRole('button', { name: 'Summer', exact: true }).click();
  await expect.element(screen.getByRole('region', { name: 'Spring' })).toBeVisible();
  await expect.element(screen.getByRole('region', { name: 'Summer' })).toBeVisible();
  await expect.element(screen.getByTestId('value')).toHaveTextContent('spring,summer');
});

test('↓ moves focus to the next header; a disabled item is skipped and inert', async () => {
  const screen = await render(AccordionFixture, {});

  const spring = screen.getByRole('button', { name: 'Spring', exact: true });
  (spring.element() as HTMLButtonElement).focus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByRole('button', { name: 'Summer', exact: true })).toHaveFocus();
  await expect.element(screen.getByRole('button', { name: 'Autumn', exact: true })).toBeDisabled();
});

test('searchable: a closed panel is hidden="until-found"; off, it is plain hidden', async () => {
  const screen = await render(AccordionFixture, {});
  const content = screen.container.querySelector('[aria-labelledby]');
  expect(content?.getAttribute('hidden')).toBe('until-found');

  await screen.unmount();
  const plain = await render(AccordionFixture, { searchable: false });
  const closed = plain.container.querySelector('[data-accordion-content]');
  expect(closed?.getAttribute('hidden')).not.toBe('until-found');
});
