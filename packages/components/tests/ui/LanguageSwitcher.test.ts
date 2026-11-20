import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import LanguageSwitcher from '../../src/lib/ui/LanguageSwitcher.svelte';
import { languageEndonyms } from '../../src/lib/ui/language-names.ts';

test('names each locale in its own language, dropping a region no other locale shares', () => {
  const names = languageEndonyms(['en-AU', 'es-419', 'de']);
  expect(names.get('en-AU')).toBe('English');
  expect(names.get('es-419')).toBe('Español');
  expect(names.get('de')).toBe('Deutsch');
});

test('keeps the region when two locales share a language, and takes overrides', () => {
  const names = languageEndonyms(['en-AU', 'en-GB', 'fr'], { fr: 'Français (France)' });
  // The exact wording ("Australian English" or "English (Australia)") is the runtime's.
  expect(names.get('en-AU')).toMatch(/English/);
  expect(names.get('en-AU')).not.toBe('English');
  expect(names.get('en-GB')).toMatch(/English/);
  expect(names.get('en-GB')).not.toBe(names.get('en-AU'));
  expect(names.get('fr')).toBe('Français (France)');
});

test('two locales: one button naming the other language, in that language', async () => {
  const onSelect = vi.fn<(locale: string) => void>();
  const screen = await render(LanguageSwitcher, {
    locales: ['en-AU', 'es-419'],
    current: 'en-AU',
    onSelect,
  });

  const toggle = screen.getByRole('button', { name: 'Switch to Español' });
  await expect.element(toggle).toHaveTextContent('Español');
  await expect.element(toggle).not.toHaveAttribute('lang');
  await expect.element(screen.getByText('Español')).toHaveAttribute('lang', 'es-419');

  await userEvent.click(toggle);
  expect(onSelect).toHaveBeenCalledWith('es-419');
});

test('two locales with href: a link with hreflang that works without JavaScript', async () => {
  const screen = await render(LanguageSwitcher, {
    locales: ['en-AU', 'es-419'],
    current: 'es-419',
    href: (locale) => `/${locale}/books`,
    switchLabel: (name) => `Cambiar a ${name}`,
  });

  const link = screen.getByRole('link', { name: 'Cambiar a English' });
  await expect.element(link).toHaveAttribute('href', '/en-AU/books');
  await expect.element(link).toHaveAttribute('hreflang', 'en-AU');
});

test('three locales with onSelect: a menu of radio items, the current one checked', async () => {
  const onSelect = vi.fn<(locale: string) => void>();
  const screen = await render(LanguageSwitcher, {
    locales: ['en-AU', 'es-419', 'de'],
    current: 'en-AU',
    onSelect,
  });

  await userEvent.click(screen.getByRole('button', { name: 'Language: English' }));
  await expect.element(screen.getByRole('menu', { name: 'Language' })).toBeInTheDocument();
  await expect
    .element(screen.getByRole('menuitemradio', { name: 'English' }))
    .toHaveAttribute('aria-checked', 'true');
  await expect
    .element(screen.getByRole('menuitemradio', { name: 'Deutsch' }))
    .toHaveAttribute('aria-checked', 'false');

  await userEvent.click(screen.getByRole('menuitemradio', { name: 'Deutsch' }));
  expect(onSelect).toHaveBeenCalledWith('de');
});

test('three locales with href: a menu of links, the current one marked', async () => {
  const screen = await render(LanguageSwitcher, {
    locales: ['en-AU', 'es-419', 'de'],
    current: 'de',
    href: (locale) => `/${locale}/`,
  });

  await userEvent.click(screen.getByRole('button', { name: 'Language: Deutsch' }));
  const current = screen.getByRole('menuitem', { name: 'Deutsch' });
  await expect.element(current).toHaveAttribute('href', '/de/');
  await expect.element(current).toHaveAttribute('aria-current', 'page');
  await expect
    .element(screen.getByRole('menuitem', { name: 'Español' }))
    .not.toHaveAttribute('aria-current');
});

test('variant forces the menu even for two locales', async () => {
  const screen = await render(LanguageSwitcher, {
    locales: ['en-AU', 'es-419'],
    current: 'en-AU',
    onSelect: () => undefined,
    variant: 'menu',
  });

  await expect.element(screen.getByRole('button', { name: 'Language: English' })).toBeVisible();
});
