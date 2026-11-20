import { expect, test } from 'vite-plus/test';
import { atLeast, drawQr } from '../../src/lib/media/qr/qr-matrix.ts';
import { Ecc, QrCode } from '../../src/lib/media/qr/qrcodegen.ts';

// The upstream encoder's output for "HELLO WORLD" at level Q: version 1, mask 0.
const HELLO_WORLD_Q = [
  '111111101100001111111',
  '100000101001001000001',
  '101110101001101011101',
  '101110101000001011101',
  '101110101010001011101',
  '100000100010001000001',
  '111111101010101111111',
  '000000001000000000000',
  '011010110000101011111',
  '010000001111000010001',
  '001101110110001011000',
  '011011010011010101110',
  '100010101011101110101',
  '000000001101001000101',
  '111111101010000101100',
  '100000100101101101000',
  '101110101010001111111',
  '101110100101010100010',
  '101110101001011101001',
  '100000101011110001011',
  '111111100001011100001',
];

test('the vendored encoder matches the reference matrix for HELLO WORLD at level Q', () => {
  const code = QrCode.encodeText('HELLO WORLD', Ecc.QUARTILE);

  expect(code.version).toBe(1);
  expect(code.mask).toBe(0);
  const rows = Array.from({ length: code.size }, (_row, y) =>
    Array.from({ length: code.size }, (_cell, x) => (code.getModule(x, y) ? '1' : '0')).join(''),
  );
  expect(rows).toEqual(HELLO_WORLD_Q);
});

test('the drawing is one path of runs, offset by the quiet zone', () => {
  const drawing = drawQr('HELLO WORLD', 'Q', 4);

  expect(drawing?.extent).toBe(29);
  expect(drawing?.ecc).toBe('Q');
  expect(drawing?.version).toBe(1);
  // The first row starts with a seven-module finder run.
  expect(drawing?.path.startsWith('M4 4h7v1h-7z')).toBe(true);
  const dark = HELLO_WORLD_Q.join('')
    .split('')
    .filter((bit) => bit === '1').length;
  const drawn = [...(drawing?.path.matchAll(/h(\d+)/g) ?? [])].reduce(
    (sum, match) => sum + Number(match[1]),
    0,
  );
  expect(drawn).toBe(dark);
});

test('a value too long for any version is undefined', () => {
  expect(drawQr('x'.repeat(3000), 'H', 4)).toBeUndefined();
});

test('atLeast raises a level to the floor and never lowers it', () => {
  expect(atLeast('L', 'Q')).toBe('Q');
  expect(atLeast('H', 'Q')).toBe('H');
});
