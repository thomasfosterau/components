import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ExpandableTextFixture from './fixtures/ExpandableTextFixture.svelte';

test('short text renders no toggle at all', async () => {
  const screen = await render(ExpandableTextFixture, { long: false });

  await expect.element(screen.getByText('Short.')).toBeInTheDocument();
  expect(screen.container.querySelector('button')).toBeNull();
});

test('long text: Show more expands it, the name follows the state, and the height grows', async () => {
  const screen = await render(ExpandableTextFixture);
  const more = screen.getByRole('button', { name: 'Show more' });

  await expect.element(more).toHaveAttribute('aria-expanded', 'false');
  const text = document.getElementById(more.element().getAttribute('aria-controls') ?? '');
  const collapsed = text?.getBoundingClientRect().height ?? 0;

  await more.click();
  const less = screen.getByRole('button', { name: 'Show less' });
  await expect.element(less).toHaveAttribute('aria-expanded', 'true');
  await expect.element(screen.getByTestId('expanded')).toHaveTextContent('true');
  expect(text?.getBoundingClientRect().height ?? 0).toBeGreaterThan(collapsed);

  await less.click();
  await expect.element(screen.getByRole('button', { name: 'Show more' })).toHaveFocus();
});

test('while collapsed, the whole text is still in the DOM and not hidden', async () => {
  const screen = await render(ExpandableTextFixture);

  const last = screen.getByText(/The last sentence is here\./);
  await expect.element(last).toBeInTheDocument();
  expect(last.element().closest('[aria-hidden="true"]')).toBeNull();
});

test('widening the container until the text fits removes the toggle', async () => {
  const screen = await render(ExpandableTextFixture);
  await expect.element(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();

  screen
    .getByTestId('frame')
    .element()
    .setAttribute('style', 'width: 6000px; font: 16px/24px sans-serif');
  await expect.poll(() => screen.container.querySelector('button')).toBeNull();
});

test('oneWay hides the toggle once expanded', async () => {
  const screen = await render(ExpandableTextFixture, { oneWay: true });

  await screen.getByRole('button', { name: 'Show more' }).click();
  await expect.element(screen.getByTestId('expanded')).toHaveTextContent('true');
  expect(screen.container.querySelector('button')).toBeNull();
});

test('lines and fade pick the collapsed styling', async () => {
  const screen = await render(ExpandableTextFixture, { lines: 2 });
  const more = screen.getByRole('button', { name: 'Show more' }).element();
  const text = document.getElementById(more.getAttribute('aria-controls') ?? '');
  expect(text?.classList.contains('line-clamp-2')).toBe(true);

  const faded = await render(ExpandableTextFixture, { fade: true });
  const fadedText = faded.container.querySelectorAll('[id$="-text"]');
  const last = fadedText[fadedText.length - 1];
  expect(last?.classList.contains('line-clamp-3')).toBe(false);
  expect(last instanceof HTMLElement ? last.style.maxHeight : '').toBe('3lh');
});
