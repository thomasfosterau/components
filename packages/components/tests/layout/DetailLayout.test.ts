import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import DetailLayoutFixture from './fixtures/DetailLayoutFixture.svelte';

test('renders the header, the body and the aside', async () => {
  const screen = await render(DetailLayoutFixture, {});

  await expect
    .element(screen.getByRole('heading', { level: 1, name: 'Rosa canina' }))
    .toBeInTheDocument();
  await expect.element(screen.getByTestId('slot-body')).toBeInTheDocument();
  await expect.element(screen.getByTestId('slot-aside')).toBeInTheDocument();
});

test('each snippet lands in its own wrapper', async () => {
  const screen = await render(DetailLayoutFixture, {});

  expect(
    screen.getByTestId('slot-body').element().closest('[data-testid="detail-body"]'),
  ).not.toBeNull();
  expect(
    screen.getByTestId('slot-aside').element().closest('[data-testid="detail-infobox"]'),
  ).not.toBeNull();
});

test('the aside is a named complementary landmark', async () => {
  const screen = await render(DetailLayoutFixture, { asideLabel: 'Key facts' });

  const aside = screen.getByRole('complementary', { name: 'Key facts' });
  await expect.element(aside).toBeInTheDocument();
  expect(aside.element().getAttribute('data-testid')).toBe('detail-infobox');
});

test('the aside precedes the body in the document, so mobile reads title → aside → body', async () => {
  const screen = await render(DetailLayoutFixture, {});

  const body = screen.getByTestId('detail-body').element();
  const aside = screen.getByTestId('detail-infobox').element();

  // Rendered once and REORDERED, never rendered twice: `order-first` on a
  // phone, explicit grid placement from `lg`.
  expect(aside).toHaveClass('order-first');
  expect(aside).toHaveClass('lg:order-none');
  expect(aside).toHaveClass('lg:col-start-3');
  expect(body).toHaveClass('lg:col-span-2');
  expect(screen.getByTestId('slot-aside').elements()).toHaveLength(1);
});

test('without an aside there is no complementary landmark and no empty column', async () => {
  const screen = await render(DetailLayoutFixture, { withAside: false });

  expect(screen.getByRole('complementary').elements()).toHaveLength(0);
  expect(screen.getByTestId('detail-infobox').elements()).toHaveLength(0);
});

test('opens no landmark of its own, so the page keeps exactly one main', async () => {
  const screen = await render(DetailLayoutFixture, {});

  expect(screen.getByRole('main').elements()).toHaveLength(1);
});
