import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ThemeToggle from '../../src/lib/ui/ThemeToggle.svelte';

const STORAGE_KEY = 'components-test:theme';

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY);
  Reflect.deleteProperty(document.documentElement.dataset, 'theme');
});

test('is a switch named by its label', async () => {
  const screen = await render(ThemeToggle, {
    lightTheme: 'light',
    darkTheme: 'dark',
    storageKey: STORAGE_KEY,
    label: 'Toggle dark mode',
  });

  const control = screen.getByRole('switch', { name: 'Toggle dark mode' });
  await expect.element(control).toBeInTheDocument();
  await expect.element(control).not.toBeChecked();
});

test('toggling writes the theme to the document and to storage', async () => {
  const screen = await render(ThemeToggle, {
    lightTheme: 'garden-light',
    darkTheme: 'garden-dark',
    storageKey: STORAGE_KEY,
  });

  await userEvent.click(screen.getByRole('switch'));

  expect(document.documentElement.dataset.theme).toBe('garden-dark');
  expect(localStorage.getItem(STORAGE_KEY)).toBe('garden-dark');

  await userEvent.click(screen.getByRole('switch'));

  expect(document.documentElement.dataset.theme).toBe('garden-light');
  expect(localStorage.getItem(STORAGE_KEY)).toBe('garden-light');
});

test('a remembered dark choice is restored after mount', async () => {
  localStorage.setItem(STORAGE_KEY, 'garden-dark');

  const screen = await render(ThemeToggle, {
    lightTheme: 'garden-light',
    darkTheme: 'garden-dark',
    storageKey: STORAGE_KEY,
  });

  await expect.element(screen.getByRole('switch')).toBeChecked();
});

test('a stored value naming neither theme is ignored', async () => {
  localStorage.setItem(STORAGE_KEY, 'some-other-theme');

  const screen = await render(ThemeToggle, {
    lightTheme: 'garden-light',
    darkTheme: 'garden-dark',
    storageKey: STORAGE_KEY,
  });

  await expect.element(screen.getByRole('switch')).not.toBeChecked();
});

test('the icons say nothing the switch does not', async () => {
  const screen = await render(ThemeToggle, {
    lightTheme: 'light',
    darkTheme: 'dark',
    storageKey: STORAGE_KEY,
    label: 'Toggle dark mode',
  });

  await expect.element(screen.getByRole('switch')).toHaveAccessibleName('Toggle dark mode');
});
