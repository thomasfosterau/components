import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ImageInput from '../../src/lib/fields/ImageInput.svelte';
import { fileFromDataUrl, PNG_3x2, textFile } from './files.ts';

test('measures the picture’s intrinsic size and shows it under the preview', async () => {
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(await fileFromDataUrl(PNG_3x2, 'tiny.png', 'image/png'));

  // The probe is `createImageBitmap`, so this is a real decode of a real PNG.
  await expect.element(screen.getByText('3 × 2')).toBeInTheDocument();
});

test('the preview is an object URL named by previewAlt', async () => {
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    previewAlt: 'The photograph you chose',
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(await fileFromDataUrl(PNG_3x2, 'tiny.png', 'image/png'));

  const preview = screen.getByRole('img', { name: 'The photograph you chose' });
  await expect.element(preview).toBeInTheDocument();
  expect((preview.element() as HTMLImageElement).src.startsWith('blob:')).toBe(true);
});

test('the measured dimensions ride along as hidden inputs once `name` is set', async () => {
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    name: 'file',
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(await fileFromDataUrl(PNG_3x2, 'tiny.png', 'image/png'));
  await expect.element(screen.getByText('3 × 2')).toBeInTheDocument();

  expect(screen.container.querySelector<HTMLInputElement>('input[name="width"]')?.value).toBe('3');
  expect(screen.container.querySelector<HTMLInputElement>('input[name="height"]')?.value).toBe('2');
});

test('nothing is measured and nothing is posted without a name', async () => {
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(await fileFromDataUrl(PNG_3x2, 'tiny.png', 'image/png'));
  await expect.element(screen.getByText('3 × 2')).toBeInTheDocument();

  expect(screen.container.querySelector('input[name="width"]')).toBeNull();
});

test('a file the browser cannot decode leaves the dimensions unset and does not block', async () => {
  const screen = await render(ImageInput, {
    'aria-label': 'Photograph',
    name: 'file',
    accept: 'image/png,text/plain',
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(textFile('not-a-picture.txt', 32));

  await expect.element(screen.getByRole('img')).toBeInTheDocument();
  expect(screen.container.querySelector('input[name="width"]')).toBeNull();
});
