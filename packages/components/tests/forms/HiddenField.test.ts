import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import HiddenField from '../../src/lib/forms/HiddenField.svelte';

test('posts the value under the given name', async () => {
  const screen = await render(HiddenField, { name: 'gardenId', value: '42' });

  const input = screen.container.querySelector<HTMLInputElement>('input[name="gardenId"]');
  expect(input?.type).toBe('hidden');
  expect(input?.value).toBe('42');
});

test('a number is stringified rather than dropped', async () => {
  const screen = await render(HiddenField, { name: 'gardenId', value: 42 });

  expect(screen.container.querySelector<HTMLInputElement>('input[name="gardenId"]')?.value).toBe(
    '42',
  );
});

test('it is not in the accessibility tree at all', async () => {
  const screen = await render(HiddenField, { name: 'gardenId', value: '42' });

  expect(screen.getByRole('textbox').elements()).toHaveLength(0);
});

test('native attributes pass through', async () => {
  const screen = await render(HiddenField, {
    name: 'redirectTo',
    value: '/gardens/42',
    'data-testid': 'redirect',
  });

  expect(screen.container.querySelector('[data-testid="redirect"]')).not.toBeNull();
});
