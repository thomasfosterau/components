import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ColorSwatchGroup from '../../src/lib/fields/ColorSwatchGroup.svelte';
import ColorSwatchFormFixture from './fixtures/ColorSwatchFormFixture.svelte';
import { instanceOf } from '../dom.ts';

const swatches = [
  { value: '#3a7d44', label: 'Moss green' },
  { value: '#ffeb3b', label: 'Sunflower' },
  { value: '#1e3a5f', label: 'Night blue' },
];

test('is a named radiogroup of radios named by label, never by hex', async () => {
  const screen = await render(ColorSwatchGroup, { swatches, label: 'Label colour' });

  const group = screen.getByRole('radiogroup', { name: 'Label colour' });
  await expect.element(group).toBeInTheDocument();
  await expect.element(group.getByRole('radio', { name: 'Moss green' })).toBeInTheDocument();
  const names = screen
    .getByRole('radio')
    .elements()
    .map((radio) => radio.getAttribute('aria-label'));
  expect(names).toEqual(['Moss green', 'Sunflower', 'Night blue']);
  expect(names.some((name) => name?.includes('#'))).toBe(false);
});

test('arrow keys check the next swatch, and the check is drawn in contrasting ink', async () => {
  const onValueChange = vi.fn<(value: string) => void>();
  const screen = await render(ColorSwatchGroup, {
    swatches,
    label: 'Label colour',
    value: '#3a7d44',
    onValueChange,
  });

  const moss = screen.getByRole('radio', { name: 'Moss green' });
  await expect.element(moss).toHaveAttribute('aria-checked', 'true');
  instanceOf(moss.element(), HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');

  const sunflower = screen.getByRole('radio', { name: 'Sunflower' });
  await expect.element(sunflower).toHaveAttribute('aria-checked', 'true');
  await expect.element(sunflower).toHaveFocus();
  expect(onValueChange).toHaveBeenLastCalledWith('#ffeb3b');
  expect(instanceOf(sunflower.element(), HTMLElement).style.color).toBe('rgb(0, 0, 0)');
  expect(instanceOf(moss.element(), HTMLElement).style.color).toBe('rgb(255, 255, 255)');
});

test('inside a FormField it is named by the label, described by the hint, and posts its value', async () => {
  let posted: FormData | undefined;
  const screen = await render(ColorSwatchFormFixture, {
    onSubmitted: (data: FormData) => {
      posted = data;
    },
  });

  const group = screen.getByRole('radiogroup', { name: 'Label colour' });
  await expect.element(group).toHaveAccessibleDescription('Shown on the tag.');
  await screen.getByRole('radio', { name: 'Night blue' }).click();
  await screen.getByRole('button', { name: 'Save' }).click();
  await vi.waitFor(() => {
    expect(posted?.get('colour')).toBe('#1e3a5f');
  });
});

test('fills a swatch with its colour alone, and leaves a value that is not a colour unfilled', async () => {
  const screen = await render(ColorSwatchGroup, {
    swatches: [
      { value: '#3a7d44', label: 'Moss green' },
      { value: 'red; background-image: url(https://example.com/x)', label: 'Injected' },
    ],
    label: 'Label colour',
  });

  const moss = instanceOf(screen.getByRole('radio', { name: 'Moss green' }).element(), HTMLElement);
  expect(moss.style.backgroundColor).toBe('rgb(58, 125, 68)');
  const injected = instanceOf(
    screen.getByRole('radio', { name: 'Injected' }).element(),
    HTMLElement,
  );
  expect(injected.style.backgroundColor).toBe('');
  expect(injected.style.backgroundImage).toBe('');
  expect(injected.getAttribute('style') ?? '').not.toContain('example.com');
});
