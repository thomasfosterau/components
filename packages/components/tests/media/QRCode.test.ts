import { afterEach, expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import QRCode from '../../src/lib/media/qr/QRCode.svelte';

const URL_VALUE = 'https://example.org/p/1';

afterEach(() => {
  vi.restoreAllMocks();
});

test('the code is an image named by its value, and a URL is also a real link', async () => {
  const screen = await render(QRCode, { value: URL_VALUE });

  await expect
    .element(screen.getByRole('img', { name: `QR code for ${URL_VALUE}` }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole('link', { name: URL_VALUE }))
    .toHaveAttribute('href', URL_VALUE);
});

test('showValue puts the value in a visible caption', async () => {
  const screen = await render(QRCode, { value: 'Bed 4 · Tomato', showValue: true });

  await expect.element(screen.getByText('Bed 4 · Tomato')).toBeVisible();
  expect(screen.getByRole('link').elements()).toHaveLength(0);
});

test('a logo raises error correction to at least Q', async () => {
  const withLogo = await render(QRCode, {
    value: URL_VALUE,
    ecc: 'L',
    logo: { src: 'data:image/png;base64,' },
  });
  // The encoder may go higher still when it costs no size.
  expect(['Q', 'H']).toContain(withLogo.container.querySelector('svg')?.getAttribute('data-ecc'));
  await withLogo.unmount();

  const plain = await render(QRCode, { value: URL_VALUE, ecc: 'L' });
  expect(['L', 'M', 'Q', 'H']).toContain(
    plain.container.querySelector('svg')?.getAttribute('data-ecc'),
  );
  const defaultLogo = await render(QRCode, {
    value: URL_VALUE,
    logo: { src: 'data:image/png;base64,' },
  });
  expect(defaultLogo.container.querySelector('svg')?.getAttribute('data-ecc')).toBe('H');
});

test('an expired code is named as expired, and Refresh calls onRefresh', async () => {
  const onRefresh = vi.fn<() => void>();
  const screen = await render(QRCode, { value: URL_VALUE, status: 'expired', onRefresh });

  await expect.element(screen.getByRole('img', { name: 'Expired QR code' })).toBeInTheDocument();
  await expect.element(screen.getByText('Code expired')).toBeVisible();
  const refresh = screen.getByRole('button', { name: 'Refresh' });
  // Tests load no CSS, so the overlay overflows the unstyled tile under the
  // visually hidden link; a DOM click reaches the button regardless.
  const button = refresh.element();
  if (button instanceof HTMLElement) button.click();
  expect(onRefresh).toHaveBeenCalledOnce();
});

test('download saves a standalone SVG with one path', async () => {
  const blobs: Blob[] = [];
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    if (blob instanceof Blob) blobs.push(blob);
    return 'blob:qr';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  const clicks = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  const screen = await render(QRCode, { value: URL_VALUE, downloadable: true });

  await userEvent.click(screen.getByRole('button', { name: 'Download QR code' }));

  expect(clicks).toHaveBeenCalledOnce();
  const svg = await blobs[0]?.text();
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(svg?.match(/<path/g)).toHaveLength(1);
  expect(svg).not.toContain('class=');
});

test('a value too long to encode says so instead of drawing', async () => {
  const screen = await render(QRCode, { value: 'x'.repeat(3000) });

  await expect.element(screen.getByText('This is too long for a QR code.')).toBeVisible();
  expect(screen.getByRole('img').elements()).toHaveLength(0);
});

const detectorAvailable = 'BarcodeDetector' in globalThis;

test.skipIf(!detectorAvailable)('the rendered code decodes back to its value', async () => {
  const screen = await render(QRCode, { value: URL_VALUE, size: 256 });
  const svg = screen.container.querySelector('svg');
  if (svg === null) throw new Error('no svg');
  const markup = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  image.src = `data:image/svg+xml,${encodeURIComponent(markup.replace('<svg', '<svg style="background:#fff"'))}`;
  await image.decode();
  // @ts-expect-error BarcodeDetector is not in the DOM lib.
  const detector = new BarcodeDetector({ formats: ['qr_code'] });
  const [found] = await detector.detect(image);
  expect(found?.rawValue).toBe(URL_VALUE);
});
