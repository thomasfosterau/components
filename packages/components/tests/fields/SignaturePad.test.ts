/**
 * `SignaturePad`'s contract: drawn strokes become SVG paths with a status
 * the pad is described by, Undo and Clear, the typed alternative, the
 * required check, the posted SVG and the PNG export.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { signatureToPng, strokesToSvg } from '../../src/lib/fields/signature.ts';
import { drag } from '../canvas/pointer.ts';
import SignaturePadFixture from './fixtures/SignaturePadFixture.svelte';

test('drawing two strokes gives a drawn value with two paths', async () => {
  const screen = await render(SignaturePadFixture, {});

  const pad = screen.getByRole('img', { name: 'Signature area' });
  await expect
    .element(pad)
    .toHaveAccessibleDescription('Sign above To sign without drawing, use the Type tab.');
  await drag(pad, { x: 20, y: 30 }, { x: 120, y: 60 });
  await drag(pad, { x: 40, y: 70 }, { x: 160, y: 20 });

  await expect.element(screen.getByTestId('kind')).toHaveTextContent('drawn');
  await expect.element(screen.getByTestId('paths')).toHaveTextContent('2');
  await expect
    .element(pad)
    .toHaveAccessibleDescription('Signature drawn To sign without drawing, use the Type tab.');
});

test('Undo removes the last stroke and Clear empties the pad', async () => {
  const screen = await render(SignaturePadFixture, {});

  const undo = screen.getByRole('button', { name: 'Undo' });
  const clear = screen.getByRole('button', { name: 'Clear' });
  await expect.element(undo).toBeDisabled();
  const pad = screen.getByRole('img', { name: 'Signature area' });
  await drag(pad, { x: 20, y: 30 }, { x: 120, y: 60 });
  await drag(pad, { x: 40, y: 70 }, { x: 160, y: 20 });

  await undo.click();
  await expect.element(screen.getByTestId('paths')).toHaveTextContent('1');
  await clear.click();
  await expect.element(screen.getByTestId('kind')).toHaveTextContent('none');
  await expect.element(clear).toBeDisabled();
});

test('the Type tab gives a typed value', async () => {
  const screen = await render(SignaturePadFixture, {});

  await screen.getByRole('tab', { name: 'Type' }).click();
  await screen.getByRole('textbox', { name: 'Type your full name' }).fill('Thomas Foster');
  await expect.element(screen.getByTestId('kind')).toHaveTextContent('typed');
  await expect.element(screen.getByTestId('typed')).toHaveTextContent('Thomas Foster');
});

test('required: submitting with no signature shows the error and blocks the form', async () => {
  const onSubmitted = vi.fn<(data: FormData) => void>();
  const screen = await render(SignaturePadFixture, { required: true, onSubmitted });

  await screen.getByRole('button', { name: 'Submit' }).click();
  const group = screen.getByRole('group', { name: /^Signature/ });
  await expect.element(group).toHaveAccessibleDescription('Sign or type your name');
  expect(onSubmitted).not.toHaveBeenCalled();

  await screen.getByRole('tab', { name: 'Type' }).click();
  await screen.getByRole('textbox', { name: 'Type your full name' }).fill('A Person');
  await expect.element(screen.getByText('Sign or type your name')).not.toBeInTheDocument();
  await screen.getByRole('button', { name: 'Submit' }).click();
  expect(onSubmitted.mock.calls[0]?.[0].get('signature')).toContain('A Person');
});

test('without allowTyped there are no tabs, and development builds warn', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const screen = await render(SignaturePadFixture, { allowTyped: false });

  expect(screen.getByRole('tab').elements()).toHaveLength(0);
  await expect.element(screen.getByRole('img', { name: 'Signature area' })).toBeVisible();
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('WCAG 2.1.1'));
  warn.mockRestore();
});

test('signatureToPng returns a PNG of the requested size', async () => {
  const svg = strokesToSvg(
    [
      [
        { x: 10, y: 10 },
        { x: 200, y: 80 },
      ],
    ],
    { aspect: 3, strokeWidth: 2 },
  );
  const blob = await signatureToPng({ kind: 'drawn', svg }, { width: 300, height: 100 });
  expect(blob.type).toBe('image/png');
  const bitmap = await createImageBitmap(blob);
  expect([bitmap.width, bitmap.height]).toEqual([300, 100]);
});

test('typing in the Type tab works from the keyboard alone', async () => {
  const screen = await render(SignaturePadFixture, {});

  await userEvent.tab();
  await userEvent.keyboard('{ArrowRight}');
  await expect
    .element(screen.getByRole('tab', { name: 'Type' }))
    .toHaveAttribute('aria-selected', 'true');
});
